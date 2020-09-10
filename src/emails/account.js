const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
	sgMail.send({
		to: email,
		from: 'grega.lasnibat@gmail.com',
		subject: 'Welcome to the App, Jeans',
		text: `Heil, ${name}. Keep em high and tight.`,
		
	})
}

const sendCancelationEmail = (email, name) => {
	sgMail.send({
		to: email,
		from: 'grega.lasnibat@gmail.com',
		subject: `Ta-ta there, ${name}!`,
		text: "Didn't follow proto, now you're gone, chomo."
	})
}

module.exports = {
	sendWelcomeEmail,
	sendCancelationEmail
}
