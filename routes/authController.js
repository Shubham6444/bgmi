const express = require('express');
const router = express.Router();
const googleAuthController = require('../controllers/googleAuth');
const razorpayController = require('../controllers/razorpay');
const wallethistory = require('../controllers/waletHistory');
const userwalletController = require('../controllers/userWallet');
const tournamentc = require('../controllers/toornament')
const userdata = require('../controllers/userdata')
const updateUserProfile = require('../controllers/updateProfile')
const helpline = require('../controllers/help')
const test = require('../controllers/test')
// ✅ Define the routes for adding money & verifying payments
router.get('/test', test.test);
router.post('/addmoney', razorpayController.createorder);
router.post('/verifypayment', razorpayController.verifypayment);
// router.post('/payment', razorpayController.payment);

router.get('/wallet_history', wallethistory.fetchTransactionHistory);
router.get('/userwallet', userwalletController.userwallet);
router.post('/withdraw', userwalletController.withdraw);
router.get('/tournaments', tournamentc.tournaments);
router.get('/joined', tournamentc.joined);
router.get('/joinedall', tournamentc.joinedall);
router.post('/joinenow', tournamentc.joinenow);
router.post('/checkingJoin', tournamentc.checkingJoin);
router.post('/Create_tournament', tournamentc.Create_tournaments);
router.post('/Update_tournament', tournamentc.Update_tournament);
router.post('/Delete_tournament', tournamentc.Delete_tournament);
router.get('/user-data', userdata.userdata);
router.post('/completeHistory', userdata.completeHistory);
router.put('/updateUser', userdata.updateUser);
router.delete('/deleteUser', userdata.deleteUser);
router.put('/updateTournamentByEmail', userdata.updateTournamentByEmail);
router.put('/updateProfile', updateUserProfile.updateUserProfile);
router.put('/updatepassword', updateUserProfile.updatepassword);
router.get('/logout', googleAuthController.logout);
router.post('/customLogin', googleAuthController.customLogin); // Initiate OAuth
router.post('/signup', googleAuthController.customSignup); // Initiate OAuth

// Create an Express Router for this endpoint
router.post('/help', helpline.help);
router.get('/helpinfo', helpline.helpinfo);
router.get('/helpinfoadmin', helpline.helpinfoadmin);
router.put('/helpupdate', helpline.helpupdate);
// ✅ Google OAuth routes
router.get('/google', googleAuthController.googleAuth); // Initiate OAuth
router.get('/google/callback', googleAuthController.googleCallback); // OAuth callback route

module.exports = router;
