const router = require('express').Router();

exports.router = router;

const { businesses } = require('./businesses');
const { reviews } = require('./reviews');
const { photos } = require('./photos');
const { getDb } = require("../lib/mongo")
/*
 * Route to list all of a user's businesses.
 */
router.get('/:userid/businesses', async function (req, res) {
  const userid = parseInt(req.params.userid);
  const db = getDb()
  const collection = db.collection("businesses")
  const userBusinesses = await collection.find(({ownerid: userid}))
    .sort({ _id: 1 })
    .toArray()
  console.log(userBusinesses)
  //const userBusinesses = businesses.filter(business => business && business.ownerid === userid);
  res.status(200).json({
    businesses: userBusinesses
  });
});

/*
 * Route to list all of a user's reviews.
 */
router.get('/:userid/reviews', async function (req, res) {
  const userid = parseInt(req.params.userid);
  const db = getDb()
  const collection = db.collection("photos")

  const userReviews = await collection.find(({userid: userid}))
    .sort({ _id: 1 })
    .toArray()
  res.status(200).json({
    reviews: userReviews
  });
});

/*
 * Route to list all of a user's photos.
 */
router.get('/:userid/photos', async function (req, res) {
  const userid = parseInt(req.params.userid);
  const db = getDb()
  const collection = db.collection("reviews")

  const userPhotos = await collection.find(({userid: userid}))
    .sort({ _id: 1 })
    .toArray()
  res.status(200).json({
    photos: userPhotos
  });
});
