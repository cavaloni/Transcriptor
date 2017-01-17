#Transcriptor
Thinkful (https://www.thinkful.com/) Node Capstone final project.


![Screenshots](https://drive.google.com/uc?export=view&id=0B4WuvBhzCho_SW1kRm1FRnlqVnc)

##Introduction
Transcriptor is a tool to simpify qualitiative researchers lives. Useful for students and professionals alike, it is a very simple, easy to use database to store document files of transcriptions, and to easily search through all of the texts to find relavant session transcriptions. Note: Each user is associated to one project in this demo version, though future versions will include multiple projects, as well as role management with administers. For now, admin functions are available to every user.

##Use Case
Using services like Google Drive and DropBox are popular options for qualitative researchers, though they can often cause frustration through the extra layer of complexity of setting sharing options, sorting through folders, and universalizing file types. Transcriptor is a very simple, easy to use, quick and adaptive web application to ease these frustrations and simply upload documents to be able to search through them while protecting their security. 

##UX

Wireframes were made prior to any code being written. Some minimal user feedback was obtained through questions about the display and flow, though mostly this kind of feedback was obtained during the release of the minimum viable product useable wireframe.


##Live Site
You can access the live site at https://intense-ravine-62468.herokuapp.com/

##Technical
- Transcriptor uses javascript on the front-end and on the back-end with NodeJS
- JQuery is used on the front end for style and transitions and to make ajax requests
- ExpressJS is used on the back-end with Node to simplify the server writing process
- MongoDB is used as the database to store the transcriptions
- Mongoose is used to interact with MongoDB in Node and setup its Schemas
- Express-Sessions is used to set-up persistent user Sessions
- PassportJS is used to authenticate users
- Passport-sessions to maintain persistent session following express-sessions and to protect every endpoint on the server
- BcryptJS to encrypt user passwords
- Multer to store the original document files on the server
- Textract to extract the text from the files to use in MongoDB to make the text searchable
- MochaJS to test the server
- Chai, Chai-http, and supertest-as-promised to test the individual endpoints with authentication
- MLab to host the database
- TravisCI to continuously test and deploy to
- Heroku to host the application
