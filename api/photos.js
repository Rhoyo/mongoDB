const router = require('express').Router();
const { validateAgainstSchema, extractValidFields } = require('../lib/validation');
const { getDb } = require("../lib/mongo")

const photos = require('../data/photos');

exports.router = router;
exports.photos = photos;

/*
 * Schema describing required/optional fields of a photo object.
 */
const photoSchema = {
  userid: { required: true },
  businessid: { required: true },
  caption: { required: false }
};


/*
 * Route to create a new photo.
 */
router.post('/', async function (req, res, next) {
  if (validateAgainstSchema(req.body, photoSchema)) {
    const photo = extractValidFields(req.body, photoSchema);

    const db = getDb()
    const collection = db.collection("photos")

    photo.id = await collection.countDocuments();
    const result = await collection.insertOne(photo)

    res.status(201).json({
      id: photo.id,
      links: {
        photo: `/photos/${photo.id}`,
        business: `/businesses/${photo.businessid}`
      }
    });
  } else {
    res.status(400).json({
      error: "Request body is not a valid photo object"
    });
  }
});

/*
 * Route to fetch info about a specific photo.
 */
router.get('/:photoID', async function (req, res, next) {
  const photoID = parseInt(req.params.photoID);

  const db = getDb()
  const collection = db.collection("photos")
  const toFind = await collection.findOne({id: photoID})

  if (toFind) {
    console.log(toFind)
    res.status(200).json(toFind);
  } else {
    next();
  }
});

/*
 * Route to update a photo.
 */
router.put('/:photoID', async function (req, res, next) {
  const photoID = parseInt(req.params.photoID);

  const db = getDb()
  const collection = db.collection("photos")
  const toReplace = await collection.findOne({id: photoID})

  if (toReplace) {
    console.log(toReplace)
    if (validateAgainstSchema(req.body, photoSchema)) {
      /*
       * Make sure the updated photo has the same businessid and userid as
       * the existing photo.
       */
      const updatedPhoto = extractValidFields(req.body, photoSchema);
      const existingPhoto = toReplace;
      if (existingPhoto && updatedPhoto.businessid === existingPhoto.businessid && updatedPhoto.userid === existingPhoto.userid) {

        result = await collection.updateOne({id: photoID}, {$set: updatedPhoto});

        res.status(200).json({
          links: {
            photo: `/photos/${photoID}`,
            business: `/businesses/${updatedPhoto.businessid}`
          }
        });
      } else {
        res.status(403).json({
          error: "Updated photo cannot modify businessid or userid"
        });
      }
    } else {
      res.status(400).json({
        error: "Request body is not a valid photo object"
      });
    }

  } else {
    next();
  }
});

/*
 * Route to delete a photo.
 */
router.delete('/:photoID', async function (req, res, next) {
  const photoID = parseInt(req.params.photoID);

  const db = getDb()
  const collection = db.collection("photos")
  const toDelete = await collection.findOne({id: photoID})


  if (toDelete) {
    console.log(toDelete)
    collection.deleteOne({id: photoID});
    res.status(204).end();
  } else {
    next();
  }
});
