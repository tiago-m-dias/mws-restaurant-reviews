let restaurant;
var newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
 document.addEventListener('DOMContentLoaded', (event) => {
   initMap();
 });

 /**
 + * Initialize leaflet map
 + */
 const initMap = () => {
   fetchRestaurantFromURL((error, restaurant) => {
     if (error) { // Got an error!
       console.error(error);
     } else {
       self.newMap = L.map('map', {
         center: [restaurant.latlng.lat, restaurant.latlng.lng],
         zoom: 16,
         scrollWheelZoom: false
       });
       L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
         mapboxToken: 'pk.eyJ1IjoidC1tYWQiLCJhIjoiY2ppYWUycGx4MTNmYTN3bWxlMXFkZ2dpNiJ9.Ts9mBSf986SO2Y8hZCREqQ',
         maxZoom: 18,
         attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
           '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
           'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
         id: 'mapbox.streets'
       }).addTo(newMap);
       fillBreadcrumb();
       DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
     }
   });
   DBHelper.nextPending();
 }
// window.initMap = () => {
//   fetchRestaurantFromURL((error, restaurant) => {
//     if (error) { // Got an error!
//       console.error(error);
//     } else {
//       self.map = new google.maps.Map(document.getElementById('map'), {
//         zoom: 16,
//         center: restaurant.latlng,
//         scrollwheel: false
//       });
//       fillBreadcrumb();
//       DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
//     }
//   });
// }

/**
 * Get current restaurant from page URL.
 */
const fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
const fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;


  const imageContainer = document.getElementById('restaurant-img-container');

  const fav = document.createElement('button');
  fav.id = "favorite-button-" + restaurant.id;

  let favStatus;
  let favAlt;
  let favText;
  if(restaurant["is_favorite"].toString() == 'true') {
    favStatus = true;
    favText = '★';
    favAlt = 'Click to remove ' + restaurant.name + ' from your favorites!' + favStatus + !favStatus;
  } else {
    favStatus = false;
    favText = '☆';
    favAlt = 'Click to add '+ restaurant.name +' to your favorites!' + favStatus + !favStatus;
  }

  //console.log("favStatus for " + restaurant.name + " is : " + favStatus);
  //console.log("creating onclick for " + restaurant.name + `width id: ${restaurant.id} and status: ${favStatus}`);
  fav.onclick = event => favClick(restaurant.id, !favStatus, restaurant.name);


  fav.innerHTML = favText;
  fav.setAttribute('aria-label', favAlt);

  imageContainer.append(fav);

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  image.src = DBHelper.imageUrlForRestaurant(restaurant, 's');
  image.srcset = DBHelper.imageUrlForRestaurant(restaurant, 's') + ' 369w, '
  + DBHelper.imageUrlForRestaurant(restaurant, 'm') + ' 424w, '
  + DBHelper.imageUrlForRestaurant(restaurant, 'l') + ' 821w, '
  +DBHelper.imageUrlForRestaurant(restaurant, 'xl') + ' 1600w';
  image.alt = DBHelper.imageAltForRestaurant(restaurant);
  image.title = DBHelper.imageAltForRestaurant(restaurant);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  DBHelper.fetchRestaurantReviews(restaurant.id, fillReviewsHTML);
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
const fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
const fillReviewsHTML = (e, reviews = self.restaurant.reviews) => {

  if(e) console.log("Error : " + e);
  const container = document.getElementById('reviews-container');
  const flex = document.createElement("div");
  flex.id = "reviews-heading";
  container.appendChild(flex);

  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  flex.appendChild(title);
  //container.appendChild(title);

  const addReviewLink = document.createElement("a");
  addReviewLink.href = "#review-form";
  addReviewLink.setAttribute('aria-label', "Click to add a review");
  addReviewLink.innerHTML = "Add Review";
  flex.appendChild(addReviewLink);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
const createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  name.className = 'reviews-name';
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = new Date(review.createdAt).toLocaleString();
  date.className = 'reviews-date';
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  rating.className = 'reviews-rating reviews-rate' + review.rating;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  comments.className = 'reviews-comments';
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
const fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
const getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}


const favClick = (id, state, name) => {
  const fav = document.getElementById("favorite-button-" + id);
  self.restaurant["is_favorite"] = state;
  fav.onclick = event => favClick(restaurant.id, !self.restaurant["is_favorite"], restaurant.name);
  DBHelper.favClick(id, state, restaurant.name);
}

const saveReview = () => {
  // Get the data points for the review
  const name = document.getElementById("review-name").value;
  const rating = document.getElementById("review-rating").value;
  const comment = document.getElementById("review-comment").value;
  //console.log("restaurant_info review-name: ", name);
  DBHelper.saveReview(self.restaurant.id, name, rating, comment, (error, review) => {
    if (error) {
      console.log("Error saving review")
    }
  });
}


