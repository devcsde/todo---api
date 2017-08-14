/**
 * Created by csche on 19.07.2017.
 */
let mongoose = require("mongoose");

mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI, {
    useMongoClient: true,
    /* other options */
});

module.exports = {mongoose};