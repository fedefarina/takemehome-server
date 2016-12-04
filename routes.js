'use strict';

function authenticateAndRun(app) {
	return app.passport.authenticate('local');
}

function ensureLocation(request, response, next) {
	if (!request.query || !request.query.latitude || !request.query.longitude || !request.query.radius) {
		return response.status(400).json({error: "Location should be provided"});
	}
	return next();
}

exports = module.exports = function(app) {
	app.post('/login', authenticateAndRun(app), require('./api/user').login);
	app.get('/users/:id', require('./api/user').get);
	app.get('/users', require('./api/user').getAll);
	app.post('/users', require('./api/user').create);
	app.put('/users/:id', require('./api/user').update);
	app.delete('/users/:id', require('./api/user').delete);
	app.get('/users/:id/photo', require('./api/user').getProfilePhoto);
	app.get('/users/:user/profile', require('./api/user').getProfile);
	app.get('/form_newUser', require('./api/user').form_newUser);
	app.get('/form_viewUser', require('./api/user').form_viewUser);
	app.get('/form_editUser', require('./api/user').form_editUser);
};
