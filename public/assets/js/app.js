// Global state variable

const state = {
    currentRenderedResults : [],
    loggedIn: '',
    project: ''
};

//Initial Event Listeners
$('.sign-in-button').click(function (e) {
    e.preventDefault();
    var username =  $('#email').val();
    var password = $('#password').val();
    loginUser(username, password);
})

$('#search').on('click', function (e) {
    e.preventDefault();
    displaySearchPanel();
});

$('#upload').on('click', function () {
    renderUploadBox();
})

$('#my-uploads').on('click', function () {
    renderMyUploads();
})

$('#recent-uploads').on('click', function () {
    getRecentTranscripts();
})

$('#help').on('click', function () {
    renderHelpBox();
})

$('.sign-up').on('click', function () {
    renderSignUpPage();
})



//-------Log-in function handlers

function loginUser(username, password) {
    state.loggedIn = username;
    $.ajax({
            type: "POST",
            url: "http://localhost:8080/users/login",
            headers: {
                'Authorization': 'Basic ' + btoa(username + ":" + password)
            },
            "data": `{\"username\": \"${username}\",\n\t\"password\": \"${password}\"\n}`
             })
        .done(function (msg) {
            state.project = msg.project;
            renderDash();
        })
        .fail(function (err) {
            renderFailedLogin();
        })
}

function renderFailedLogin () {  
    let incorrectAlert = `<div class="incorrect">
    Incorrect Username/Password</div>`
    $('.signin-box').append(incorrectAlert);
}

//Function to render sign up page and listen for actions
//Then register new user and render the "dash"

function renderSignUpPage() {
    $('.sign-up-page').empty();
    let signUpPage = `<div class="new-signup-box">
            <form action="#" class="sign-up-form">
                <label for="username">Username</label>
                <input type="text" id="new-username">
                 <label for="password">Password</label>
                <input type="text" id="new-password">
                 <label for="project">Project</label>
                <input type="text" id="project">
                </form>
                <button type="submit" class="new-sign-in-button">Sign Up</button>
        </div>`
    $('body').append('<div id="wave"/><div/>')
    $('.sign-up-page').append(signUpPage);
    $('.sign-up-page').on('click', '.new-sign-in-button', function () {
        $('#wave').remove();
        handleNewUser();
    })
}

function handleNewUser() {
    let pWord = $('#new-password').val();
    let uName = $('#new-username').val();
    let pName = $('#project').val();
    $.ajax({
            type: "POST",
            "processData": false,
            "data": `{\"username\": \"${uName}\",\n\t\"password\": \"${pWord}\",\n\t\"project\": \"${pName}\"\n}`,
            url: 'http://localhost:8080/users',
            "headers": {
                "content-type": "application/json",
                "cache-control": "no-cache",
            },
        })
        .done(function (msg) {
            state.project = msg.project;
            loginUser(uName, pWord);
        })
        .fail(function (err) {
            alert(`error ${err}`)
        });
}

//
//Initial "Dash" rendering function
//
function renderDash () {  
    $('.sign-up-page').remove();
    $('.app-wrapper').removeClass('hidden');
    $('.logged-in').text(`Hello, ${state.loggedIn}`);
    getRecentTranscripts();
}

//Initial preperation for recent, user, search bar, and search results rendering

function displaySearchPanel() {
    $('.recent').empty();
    $('.search-bar').removeClass('hidden');
    $('.js-first-search-button').click(function (e) {
        let searchTerm = $('#searchterm').val();
        e.preventDefault();
        getSearchResults(searchTerm);
    })
}

function renderSearchResults(results) {  
    $('.recent').empty();
    $('.recent').append('<div class="recent-view">Search Results</div>');
    if (results === null || results === undefined || results.length < 1) {
        $('.recent').append('<div class="no-results">No Results</div>');
    }
    renderResults(results);
}

function renderRecent(results) {
    let results1 = results;
    $('.recent').empty();
    $('.recent').append('<div class="recent-view">Recent Uploads</div>');
    renderResults(results1);
}

function renderMyUploads() {
    user = state.loggedIn;
    $.ajax({
            type: "GET",
            url: `http://localhost:8080/transcriptions/${user}`,
            xhrFields: {
                withCredentials: true
            }
        })
        .done(function (results) {
            results1 = results.transcriptions;
            $('.search-bar').addClass('hidden');
            $('.recent').empty();
            $('.recent').append('<div class="recent-view">My Recent Uploads</div>');
            renderResults(results1)
        })
        .fail(function (err) {
            alert('cannot get results for user:' + err);
        });
}


//-------Results boxes functions-----------
//Function to render results from all types of queries:
//Recent from project, recent from user, and search results

function renderResults(results) {  
    let counter = 0;
    let recentView = results.map(function (data) {
        counter++       //counter to add to ID's of search-results to identify what 'this' refers to
        let text = data.docText.slice(0, 259);      //
        text = text + '.....';                      //
        let dater = data.date.split('T');           //  Format the date to a more readable version
        let date = dater[0];                        //
        dater = data.dateUploaded.split('T');       //
        let dateupload = dater[0];                  //
        return `
        <div class="search-results-box${counter}" id="${counter}">
        <div class="info">
        <div class="info-line s-name"><span id="first-word">Name of Session: </span>${data.name}</div>
        <div class="info-line "><span id="first-word">Session Number: </span>${data.sessionNumber}</div>
        <div class="info-line"><span id="first-word">Date of Session: </span>${date}</div>
        <div class="info-line"><span id="first-word">Uploaded By: </span>${data.uploadedBy}</div>
        <div class="info-line"><span id="first-word">Date Uploaded: </span>${dateupload}</div> 
        </div>
        <div class="snippet"><span id="first-word">Preview: </span>${text}<div class="admin${counter}">Admin</div></div>  
        <div class="download-doc"><div class="download-icon" id="${counter}"></div>Download Document</div>
        words
        </div>
        </div>`
    });
    
    let boxesToRender = recentView.length;
    counter = 0;
    renderResultsBoxes();

    function renderResultsBoxes() {          //recursive function so that boxes render individually
        counter++                           //for a better looking display
        if (counter > boxesToRender) {
            return
        }
        $('.recent').append(recentView[counter - 1]);
        $(`.search-results-box${counter}`).animate({
            opacity: 1,
            height: "140px"
        }, 400);
        $(`.search-results-box${counter}`).promise().done(function () {
            renderResultsBoxes();            //Recursive call once animation is done
        });
    };
    $('.recent').on('click', '.download-icon', function () {  //listen for download click
        let nameOfSession =  $(this).attr("id");
        getDocument(nameOfSession);
})
    $('.recent').on('click', '[class^=admin]', function () {        //admin button listener
        let thisSearchBox = $(this).parents('[class^=search-results-box]');
        let thisSearchBoxId= $(this).parents('[class^=search-results-box]').attr("id");
        handleAdminButtons(thisSearchBox, thisSearchBoxId);
    });
}

function handleAdminButtons(thisSearchBox, thisSearchBoxId) {
    $('.recent').off('click', `[class^=admin]`);   
    let adminButtons = `
            <div class="delete">
                <div class="delete-icon"></div>
            Delete
            </div>
            <div class="update">
                <div class="update-icon"></div>
                Update
            </div>`;
    thisSearchBox.animate({
        height: "320px"
    });
    thisSearchBox.promise().done(function () {
        thisSearchBox.append(adminButtons).animate({
            opacity: 1
        });
    });
    $('.recent').on('click', '.delete', function () {
        let nameOfSession = $(this).parents('[class^=search-results-box]').attr("id");
        deleteDocument(nameOfSession);
    });
    $('.recent').on('click', '.update', function () {
        let nameOfSession = $(this).parents('[class^=search-results-box]').attr("id");
        updateDocument(nameOfSession);
    });
    $('.recent').on('click', `.admin${thisSearchBoxId}`, function () {
        new Promise((resolve, reject) => {
            thisSearchBox.find('.delete').remove();
            thisSearchBox.find('.update').remove();
            thisSearchBox.animate({
                height: "140px"
            });
            resolve();
        }).then(() => {
            $('.recent').off('click', `.admin${thisSearchBoxId}`);      //turn off binding and re-listen only
            $('.recent').on('click', '[class^=admin]', function () {    //when animation is complete
                let thisSearchBox = $(this).parents('[class^=search-results-box]');
                let thisSearchBoxId = $(this).parents('[class^=search-results-box]').attr("id");
                handleAdminButtons(thisSearchBox, thisSearchBoxId);
            });
        });
    });
}

//Delete function on each of the results boxes 

function deleteDocument(session) {
    let msg = 'Are you sure you want to delete?'
    renderPopUp(msg, callback)
    let thisSessionID = state.currentRenderedResults[session - 1].id;

    function callback() {
        $.ajax({
                type: "DELETE",
                url: `http://localhost:8080/transcriptions/${thisSessionID}`,
            })
            .done(function (msg) {
                $(`.search-results-box${session}`).animate({
                    opacity: 0,
                    height: "0px"
                }, 500);
                $(`.search-results-box${session}`).promise().done(function () {  
                    $(`.search-results-box${session}`).remove();
                    getRecentTranscripts();
                });
                
            })
            .fail(function (err) {
                alert(`error ${err}`)
            });
    }
}


//
//Popup message used to verify delete and to notify of completion of upload and updates
//
function renderPopUp (message, callback, noCancel) {
    let popup = `<div class="help-box-wrapper">
        <div class="submission-box warn-delete">
        ${message}<br>
        <button class="ok">Ok</button>   
        <button class="cancel">Cancel</button>
        </div>
        </div>`
    $('body').append(popup);
    if (noCancel === 'true') {          //no cancel button needed to update and upload notification
        $('.cancel').addClass('hidden');
    }
    $('.help-box-wrapper').animate({
        opacity: 1
    }, 50);
    $('body').on('click', '.ok', function () {
        $('.help-box-wrapper').animate({
            opacity: 0
        }, 50);
        $('.help-box-wrapper').promise().done(() => {
            $('.help-box-wrapper').remove();
        });
        $('body').off('click', '.ok')
        callback();
    });
    $('body').on('click', 'cancel', function () { 
        $('.help-box-wrapper').animate({
            opacity: 0
        }, 50);
        $('.help-box-wrapper').promise().done(() => {
            $('.help-box-wrapper').remove();
            $('body').off('click', 'cancel');
        });
     })

}

//Function to render the Update document dialog box,
//as well as to listen for submission and cancel

function updateDocument(session) {  
    let thisSessionID = state.currentRenderedResults[session - 1].id;
    let uploadBox = `<div class="submission-box-wrapper">
        <div class="submission-box">Update Transcription
        <form enctype="multipart/form-data" action="/transcriptions/${thisSessionID}" method="post" id="submission-box-form">
        <input id="talkname" type="text" name="name" placeholder="New Name (if any)">
        <br>
        <input id="date" type="text" name="date" placeholder="New Date (if any)">
        <br>
        <input id="sessionnumber" type="text" name="sessionNumber" placeholder="New Session Number (if any)">
        <br>
        <input id="wordFile" type="file" name="docUpload" placeholder="New File Doc">
        <br>
        <input id="id-for-update" type="text" name="id" value="${thisSessionID}">
        <input type="submit" value="Update Transcription" id="submit-upload">
        </form>
        <div id="cancel-upload">Cancel</div>
        </div>
        </div>`
    $('body').append(uploadBox);
    $('.submission-box-wrapper').animate({
        opacity: 1
    }, 300);
    $('body').on('click', '#cancel-upload', function () {
        $('.submission-box-wrapper').animate({
            opacity: 0
        });
        $('.submission-box-wrapper').promise().done(() => {
            $('.submission-box-wrapper').remove();
        });
    });
     $('form#submission-box-form').submit(function (e) {
        e.preventDefault();
        var formData = new FormData($(this)[0]);
        thisurl = $(this).attr("action");
        $.ajax({
            url: `${thisurl}`,
            type: "POST",
            data: formData,
            processData: false,
            contentType: false,
            success: function (response) {
                $('.submission-box-wrapper').animate({
                    opacity: 0
                });
                $('.submission-box-wrapper').promise().done(() => {
                    $('.submission-box-wrapper').remove();
                });
                renderPopUp('Transcription Updated', getRecentTranscripts, 'true')      //notify of successful completion
            },
            error: function (jqXHR, textStatus, errorMessage) {
                renderPopUp(`Something went wrong: ${errorMessage}`, updateDocument, 'true') //and of error
            }
        });
    });
}

//
// Function to render the upload box as well as to listen for submission

function renderUploadBox() {
    let uploadBox = `<div class="submission-box-wrapper">
        <div class="submission-box">Upload Transcription
        <form enctype="multipart/form-data" action="/transcriptions/upload/${state.loggedIn}" method="post" id="submission-box-form">
        <input id="talkname" type="text" name="name" placeholder="Name of Session">
        <br>
        <input id="date" type="text" name="date" placeholder="Date of Recording">
        <br>
        <input id="sessionnumber" type="text" name="sessionNumber" placeholder="Session Number">
        <br>
        <input id="wordFile" type="file" name="docUpload">
        <br>
        <input type="submit" value="Submit" id="submit-upload">
        </form>
        <div id="cancel-upload">Cancel</div>
        </div>
        </div>`
    $('body').append(uploadBox);
    $('.submission-box-wrapper').animate({
        opacity: 1
    }, 300);
    $('body').on('click', '#cancel-upload', function () {
        $('.submission-box-wrapper').animate({
            opacity: 0
        });
        $('.submission-box-wrapper').promise().done(() => {
            $('.submission-box-wrapper').remove();
        });
    });
    $('form#submission-box-form').submit(function (e) {
        e.preventDefault();
        var formData = new FormData($(this)[0]);        //get form data from this form
        thisurl = $(this).attr("action");               //to use in ajax request
        $.ajax({
            url: `${thisurl}`,
            type: "POST",
            data: formData,
            processData: false,
            contentType: false,
            success: function (response) {
                $('.submission-box-wrapper').animate({
                    opacity: 0
                });
                $('.submission-box-wrapper').promise().done(() => {
                    $('.submission-box-wrapper').remove();
                });
                renderPopUp('Transcription Uploaded', getRecentTranscripts, 'true');
            },
            error: function (jqXHR, textStatus, errorMessage) {
                renderPopUp(`Something went wrong: ${errorMessage}`);
            }
        });
    });
}



//
//function for brief help box

function renderHelpBox() {
    let helpBox = `<div class="help-box-wrapper">
    <div class="help-box">Transcriptor is a tool for those to store and search transcriptions.
    Transcriptor accepts word documents as file format.
    It can be used, for example, in qualitative research in the humanistic sciences when a team is transcribing interviews.
    </div>
    </div>`;
    $('body').append(helpBox);
    $('.help-box-wrapper').animate({
        opacity: 1
    }, 350);
    $('body').on('click', '.help-box-wrapper', function () {
        $('.help-box-wrapper').animate({
            opacity: 0
        }, 250);
        $('.help-box-wrapper').promise().done(() => {
            $('.help-box-wrapper').remove()
        });
    });
}



//
//------------The "getters": Search, recent project uploads, recent user uploads
//

function getSearchResults (searchTerm) {  
    $.ajax({
        type: "POST",
        url: "http://localhost:8080/transcriptions/search",
        dataType: 'json',
        data: `{"search": "${searchTerm}"}`,
        xhrFields: {
        withCredentials: true
        },
        "headers": {
                "content-type": "application/json",
                "cache-control": "no-cache",
            },
    })
    .done(function (results) {
        renderSearchResults(results);
    })
    .fail(function (err) {  
        alert('yo shit broke:' + err);
    });
}

function getRecentTranscripts () {
    $.ajax({
        type: "GET",
        url: "http://localhost:8080/transcriptions",
        xhrFields: {
      withCredentials: true
        }
    })
    .done(function (results) {
        results.forEach((result) => {               //Add the results to state var
        state.currentRenderedResults.push(result)
    });
        renderRecent(results);
    })
    .fail(function (err) {  
        alert('yo shit broke:' + err);
    });
}

function getDocument (session) {
    let thisSession = state.currentRenderedResults[session - 1].name;
    let thisProject = state.project;
    $.ajax({
            type: "GET",
            url: `http://localhost:8080/transcriptions/download/${thisSession}`,
            data: `{\"sessionname\": \"${thisSession}\",\n\t\"projectName\": \"${thisProject}\"\n}`,
            xhrFields: {
                withCredentials: true
            },
            "headers": {
                "content-type": "application/json",
                "cache-control": "no-cache",
            },
            "processData": false,
        })
        .done(function (results) {
            window.location = `http://localhost:8080/transcriptions/download/${thisSession}`;
        })
        .fail(function (err) {
            alert('cannot get file: ' + err);
        });
}