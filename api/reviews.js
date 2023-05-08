const router = require('express').Router();
const { validateAgainstSchema, extractValidFields } = require('../lib/validation');
const { getDb } = require("../lib/mongo")

const reviews = require('../data/reviews');

exports.router = router;
exports.reviews = reviews;

/*
 * Schema describing required/optional fields of a review object.
 */
const reviewSchema = {
  userid: { required: true },
  businessid: { required: true },
  dollars: { required: true },
  stars: { required: true },
  review: { required: false }
};


/*
 * Route to create a new review.
 */
router.post('/', async function (req, res, next) {
  if (validateAgainstSchema(req.body, reviewSchema)) {

    const review = extractValidFields(req.body, reviewSchema);
    const db = getDb()
    const collection = db.collection("reviews")
    /*
     * Make sure the user is not trying to review the same business twice.
     */

    const userReviewedThisBusinessAlready = await collection.findOne({userid: review.userid, businessid: review.businessid})

    if (userReviewedThisBusinessAlready) {
      console.log(userReviewedThisBusinessAlready)
      res.status(403).json({
        error: "User has already posted a review of this business"
      });
    } else {
      review.id = await collection.countDocuments();
      const result = await collection.insertOne(review)
      res.status(201).json({
        id: review.id,
        links: {
          review: `/reviews/${review.id}`,
          business: `/businesses/${review.businessid}`
        }
      });
    }

  } else {
    res.status(400).json({
      error: "Request body is not a valid review object"
    });
  }
});

/*
 * Route to fetch info about a specific review.
 */
router.get('/:reviewID', async function (req, res, next) {
  const reviewID = parseInt(req.params.reviewID);

  const db = getDb()
  const collection = db.collection("reviews")
  const toFind = await collection.findOne({id: reviewID})

  if (toFind) {
    res.status(200).json(toFind);
  } else {
    next();
  }
});

/*
 * Route to update a review.
 */
router.put('/:reviewID', async function (req, res, next) {
  const reviewID = parseInt(req.params.reviewID);
  const db = getDb()
  const collection = db.collection("reviews")
  const toReplace = await collection.findOne({id: reviewID})

  if (toReplace) {

    if (validateAgainstSchema(req.body, reviewSchema)) {
      /*
       * Make sure the updated review has the same businessid and userid as
       * the existing review.
       */
      let updatedReview = extractValidFields(req.body, reviewSchema);
      let existingReview = toReplace;
      if (updatedReview.businessid === existingReview.businessid && updatedReview.userid === existingReview.userid) {

        result = await collection.updateOne({id: reviewID}, {$set: updatedReview});

        res.status(200).json({
          links: {
            review: `/reviews/${reviewID}`,
            business: `/businesses/${updatedReview.businessid}`
          }
        });
      } else {
        res.status(403).json({
          error: "Updated review cannot modify businessid or userid"
        });
      }
    } else {
      res.status(400).json({
        error: "Request body is not a valid review object"
      });
    }

  } else {
    next();
  }
});

/*
 * Route to delete a review.
 */
router.delete('/:reviewID', async function (req, res, next) {
  const reviewID = parseInt(req.params.reviewID);

  const db = getDb()
  const collection = db.collection("reviews")
  const toDelete = await collection.findOne({id: reviewID})

  if (toDelete) {
    collection.deleteOne({id: reviewID});
    res.status(204).end();
  } else {
    next();
  }
});
