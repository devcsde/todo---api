"use strict";

/**
 * Created by csche on 19.07.2017.
 */
require("./config/config");

var _ = require("lodash");
var express = require("express");
var bodyParser = require("body-parser");

var _require = require("mongodb"),
    ObjectID = _require.ObjectID;

var _require2 = require("./db/mongoose"),
    mongoose = _require2.mongoose;

var _require3 = require("./models/todo"),
    Todo = _require3.Todo;

var _require4 = require("./models/user"),
    User = _require4.User;

var _require5 = require("./middleware/authenticate"),
    authenticate = _require5.authenticate;

var app = express();

var port = process.env.PORT;

app.use(bodyParser.json());

app.post("/todos", authenticate, function (req, res) {
    var todo = new Todo({
        text: req.body.text,
        _creator: req.user._id
    });
    todo.save().then(function (doc) {
        res.send(doc);
    }, function (e) {
        res.status(400).send(e);
    });
});

app.get("/todos", authenticate, function (req, res) {
    Todo.find({
        _creator: req.user._id
    }).then(function (todos) {
        res.send({ todos: todos });
    }, function (e) {
        res.status(400).send(e);
    });
});

app.get("/todos/:id", authenticate, function (req, res) {
    var id = req.params.id;

    if (!ObjectID.isValid(id)) {
        return res.status(404).send();
    }
    Todo.findOne({
        _id: id,
        _creator: req.user._id
    }).then(function (todo) {
        if (!todo) {
            return res.status(404).send();
        }
        res.status(200).send({ todo: todo });
    }).catch(function (e) {
        res.status(400).send(e);
    });
});

app.delete("/todos/:id", authenticate, function (req, res) {
    // get the ID
    var id = req.params.id;
    // validate the ID --> not valid 404
    if (!ObjectID.isValid(id)) {
        return res.status(404).send();
    }
    Todo.findOneAndRemove({
        _id: id,
        _creator: req.user._id
    }).then(function (todo) {
        if (!todo) {
            return res.status(404).send();
        }
        res.status(200).send({ todo: todo });
    }).catch(function (e) {
        res.status(400).send(e);
    });
});

app.patch("/todos/:id", authenticate, function (req, res) {
    var id = req.params.id;
    //  lodash pick out text/completed, if it exists and assign to body
    // now only these can be accessed
    var body = _.pick(req.body, ["text", "completed"]);

    if (!ObjectID.isValid(id)) {
        return res.status(404).send();
    }

    if (_.isBoolean(body.completed) && body.completed) {
        body.completedAt = new Date().getTime();
    } else {
        body.completed = false;
        body.completedAt = null;
    }

    Todo.findOneAndUpdate({
        _id: id,
        _creator: req.user._id
    }, { $set: body }, { new: true }).then(function (todo) {
        if (!todo) {
            return res.status(404).send();
        }
        res.send({ todo: todo });
    }).catch(function (e) {
        res.status(400).send(e);
    });
});

app.post("/users", function (req, res) {
    var body = _.pick(req.body, ["email", "password"]);
    var user = new User(body);

    user.save().then(function () {
        return user.generateAuthToken();
    }).then(function (token) {
        res.header("x-auth", token).send(user);
    }).catch(function (e) {
        res.status(400).send(e);
    });
});

app.get("/users/me", authenticate, function (req, res) {
    res.send(req.user);
});

app.post("/users/login", function (req, res) {
    var body = _.pick(req.body, ["email", "password"]);

    User.findByCredentials(body.email, body.password).then(function (user) {
        return user.generateAuthToken().then(function (token) {
            res.header("x-auth", token).send(user);
        });
    }).catch(function (e) {
        res.status(400).send();
    });
});

app.delete("/users/me/token", authenticate, function (req, res) {
    req.user.removeToken(req.token).then(function () {
        res.status(200).send();
    }, function () {
        res.status(400).send();
    });
});

app.listen(port, function () {
    console.log("Started up at port " + port);
});

module.exports = { app: app };
//# sourceMappingURL=server.js.map