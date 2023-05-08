const router = require('express').Router();
const { validateAgainstSchema, extractValidFields } = require('../lib/validation');
const { getDb } = require("../lib/mongo")

const businesses = require('../data/businesses');
const { reviews } = require('./reviews');
const { photos } = require('./photos');

exports.router = router;
exports.businesses = businesses;

/*
 * Schema describing required/optional fields of a business object.
 */
const businessSchema = {
  ownerid: { required: true },
  name: { required: true },
  address: { required: true },
  city: { required: true },
  state: { required: true },
  zip: { required: true },
  phone: { required: true },
  category: { required: true },
  subcategory: { required: true },
  website: { required: false },
  email: { required: false }
};

/*
 * Route to return a list of businesses.
 */
router.get('/', async function (req, res, next) {

  /*
   * Compute page number based on optional query string parameter `page`.
   * Make sure page is within allowed bounds.
   */
  const db = getDb()
  const collection = db.collection("businesses")
  let page = parseInt(req.query.page) || 1
  page = Math.max(1, page)
  const pageSize = 5
  const offset = (page - 1) * pageSize

  const businesses = await collection.find({})
      .sort({ _id: 1 })
      .skip(offset)
      .limit(pageSize)
      .toArray()

  res.status(200).send({
      businesses: businesses
  })

});

/*
 * Route to create a new business.
 */
router.post('/', async function (req, res, next) {
  if (validateAgainstSchema(req.body, businessSchema)) {
    const business = extractValidFields(req.body, businessSchema);

    const db = getDb()
    const collection = db.collection("businesses")
    business.id = await collection.countDocuments()
    const result = await collection.insertOne(business)

    //businesses.push(business);
    res.status(201).json({
      id: business.id,
      links: {
        business: `/businesses/${business.id}`
      }
    });
  } else {
    res.status(400).json({
      error: "Request body is not a valid business object"
    });
  }
});

/*
 * Route to fetch info about a specific business.
 */
router.get('/:businessid', async function (req, res, next) {
  const businessid = parseInt(req.params.businessid);

  const db = getDb()
  const businesses = db.collection("businesses")
  const business = await businesses.findOne({id: businessid})


  if (business) {
    /*
     * Find all reviews and photos for the specified business and create a
     * new object containing all of the business data, including reviews and
     * photos.
     */

    const businessPhotos = await db.collection("photos").find({businessid: businessid})
      .sort({_id: 1})
      .toArray()

    const businessReviews = await db.collection("reviews").find({businessid: businessid})
      .sort({_id: 1})
      .toArray()

    res.status(200).json({
      business: business,
      businessPhotos: businessPhotos,
      businessReviews: businessReviews
    });
  } else {
    next();
  }
});

/*
 * Route to replace data for a business.
 */
router.put('/:businessid', async function (req, res, next) {
  const businessid = parseInt(req.params.businessid);
  const db = getDb()
  const collection = db.collection("businesses")

  const toReplace = await collection.findOne({id: businessid})

  if (toReplace) {
    console.log(toReplace)
    if (validateAgainstSchema(req.body, businessSchema)) {
      const business = extractValidFields(req.body, businessSchema);

      result = await collection.updateOne({id: businessid}, {$set: business});
      //console.log(result)

      res.status(200).json({
        links: {
          business: `/businesses/${businessid}`
        }
      });
    } else {
      res.status(400).json({
        error: "Request body is not a valid business object"
      });
    }

  } else {
    next();
  }
});

/*
 * Route to delete a business.
 */
router.delete('/:businessid', async function (req, res, next) {
  const businessid = parseInt(req.params.businessid);

  const db = getDb()
  const collection = db.collection("businesses")
  const toDelete = await collection.findOne({id: businessid})

  if (toDelete) {

    console.log(toDelete)
    collection.deleteOne({id: businessid});
    res.status(204).end();
  } else {
    next();
  }
});
