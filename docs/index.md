# Mongoose Rest Query

## Overview

Mongoose Rest Query makes the creation of rest api in mongoose a breeze. It automatically create CRUD routes up to two levels deep and provide a built-in mechanism to connect to multiple mongo databases.

## Installation

```sh
npm install mongoose-rest-query --save
npm install mongoose-auto-number --save
```

## Quick Start

Consider the following snippet

```js
const express = require('express');
const mongoose = require('mongoose');
const mrq = require('mongoose-rest-query')

mongoose.Promise = global.Promise;

const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: String,
    firstname: String,
    lastname: String
});

const models = {
    User: userSchema
};

mrq.config.modelSchemas = models;
mrq.config.dbPath = 'mongodb://localhost/restifydb';

const app = express();

app.use(mrq.db);

const restify = mrq.restify;

app.use('/api/users', restify('User'));

app.listen(9000, () => {
    console.log('Server is listening on port 9000');
});
```

The above snippet automatically generates the following api endpoints


- GET    http://localhost:9000/api/users -> List all users (subject to filter criteria) 
- POST   http://localhost:9000/api/users -> Create new user or users, can accept an object or array
- DELETE http://localhost:9000/api/users -> Delete all users (subject to filter criteria)
- GET    http://localhost:9000/api/users/count -> Get total count (subject to filter criteria)
- GET    http://localhost:9000/api/users/:id -> Get user by id (can apply populate or select in query)
- PUT    http://localhost:9000/api/users/:id -> Update user by id (also accept partial object)
- DELETE http://localhost:9000/api/users/:id -> Delete user by id
- POST   http://localhost:9000/api/users/aggregate -> Accept mongo aggregrate pipelines as body for rich aggregation



