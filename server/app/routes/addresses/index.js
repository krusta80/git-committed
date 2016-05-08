'use strict';
var mongoose = require('mongoose');
var router = require('express').Router();
var models = require('../../../db/models');
var authorization = require('../../configure/authorization-middleware.js')
var Address = models.Address;
var User = models.User;
module.exports = router;

//Req Params
router.param('id', function(req, res, next, id){
    console.log("Hitting this param route with id", id)
    Address.findById(id).populate({path: 'userId'})
    .then(function(address){
        if(!address) res.status(404).send();
        req.requestedObject = address;
        req.requestedUser = address.userId;
        next();    
    })
    .then(null, next);
})

router.param('userId', function(req, res, next, id){
    User.findById(id).exec()
    .then(function(user){
        if(!user) res.status(404).send();
        req.requestedUser = user;
        next();
    })
    .then(null, next);
})

//Route Handlers
router.get('/:id', authorization.isAdminOrResident, function(req, res, next){
    var id = req.params.id;
    Address.findById(id)
    .then(function(address){
        res.status(200).send(address);
    })
    .then(null, next);
})

router.get('/user/:userId', authorization.isAdminOrSelf, function(req, res, next){
    Address.find({userId: req.params.userId})
        .then(function(addresses){
            res.send(addresses);
        })
        .then(null, next);
});

router.post('/', function(req, res, next){
    Address.findOrCreate(req.body, function(err, newAddress, created){
        res.status(200).send(newAddress);
    })
})


//To-do: Need to DELETE certain fields and configure access control.
router.put('/:id', authorization.isAdminOrOwner, function(req, res, next){
    Address.findByIdAndUpdate(req.params.id, {dateModified: Date.now()})
    .then(function(originalAddress){
        var newAddress = {};
        var originalAddressObj = originalAddress.toObject();
        for(var key in originalAddressObj){
            if(key != '_id'){
                newAddress[key] = originalAddress[key];
            }
        }
        for(var key in req.body){
            newAddress[key] = req.body[key];
        }

        //Save to backend and return
        return Address.create(newAddress)
        .then(function(newAddress){
            return newAddress.save();
        });
    })
    .then(function(updatedAddress) {
        res.send(updatedAddress);
    })
    .then(null, next);
});

router.delete('/:id', authorization.isAdminOrOwner, function(req, res, next){
    Address.findByIdAndUpdate(req.params.id, {dateModified: Date.now()}, {new: true})
    .then(function(deletedAddress) {
        res.send(deletedAddress);
    })
    .then(null, next);
})