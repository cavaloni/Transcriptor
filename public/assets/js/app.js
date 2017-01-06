const MOCK_DATA = [{
    id: 222000123,
    name: 'Diamond Guidance',
    docText: 'Here is a very long cool talk about a lot of cool stuff that probably most people want to know about but just dont',
    date: '10-12-2002',
    dateUploaded: '10-12-2016',
    sessionNumber: 2,
    uploadedBy: 'Jane Smith'
}, {
    id: 588592001,
    name: 'Diamond Will',
    docText: 'Here is a very vaery long cool talk about a lot of cool stuff that probably most people want to know about but just dont',
    date: '11-10-2002',
    dateUploaded: '10-14-2016',
    sessionNumber: 2,
    uploadedBy: 'Jane Smith'
}, {
    id: 388901053,
    name: 'Diamond Dome',
    docText: 'Here is a very very very long cool talk about a lot of cool stuff that probably most people want to know about but just dont',
    date: '10-11-2002',
    dateUploaded: '10-16-2016',
    sessionNumber: 2,
    uploadedBy: 'John Smith'
}];

const state = {
    currentRenderedResults : [],
    loggedIn: '',
    project: ''
};

//Event Listeners
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



//-------

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
            console.log(state.project);
            renderDash();
        })
        .fail(function (err) {
            renderFailedLogin();
        })
}

function renderFailedLogin () {  
    let incorrectAlert = `<div class="incorrect">
    Incorrect Username/Password</div>`
    $('.signup-box').append(incorrectAlert);
}


function renderDash () {  
    $('.sign-up-page').remove();
    $('.app-wrapper').removeClass('hidden');
    $('.logged-in').text(`Hello, ${state.loggedIn}`);
    getRecentTranscripts();
}


function renderSignUpPage() {
    $('.sign-up-page').empty();
    let signUpPage = `<div class="new-signup-box">
            <form action="#" class="sign-up-form">
                <input type="text" id="new-username">
                <label for="username">Username</label>
                <input type="text" id="new-password">
                <label for="password">Password</label>
                <input type="text" id="project">
                <label for="project">Project</label>
                </form>
                <button type="submit" class="new-sign-in-button">Sign Up</button>
        </div>`
    $('.sign-up-page').append(signUpPage);
    $('.sign-up-page').on('click', '.new-sign-in-button', function () {
        handleNewUser();
    })
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
        addResultsToState(results);
        renderRecent(results);
    })
    .fail(function (err) {  
        alert('yo shit broke:' + err);
    });
}

function renderResults(results) {  
    let counter = 0;
    let recentView = results.map(function (data) {
        counter++
        let text = data.docText.slice(0, 259);
        text = text + '.....';
        let dater = data.date.split('T');
        let date = dater[0];
        dater = data.dateUploaded.split('T');
        let dateupload = dater[0];
        return `
        <div class="search-results-box${counter}">
        <div class="info">
        <div class="info-line s-name"><span id="first-word">Name of Session: </span>${data.name}</div>
        <div class="info-line "><span id="first-word">Session Number: </span>${data.sessionNumber}</div>
        <div class="info-line"><span id="first-word">Date of Session: </span>${date}</div>
        <div class="info-line"><span id="first-word">Uploaded By: </span>${data.uploadedBy}</div>
        <div class="info-line"><span id="first-word">Date Uploaded: </span>${dateupload}</div> 
        </div>
        <div class="snippet"><span id="first-word">Preview: </span>${text}</div>  
        <div class="download-doc" id="${counter}"><div class="download-icon"></div>Download Document</div>
        words
        </div>
        </div>`
    });
    
    let boxesToRender = recentView.length;
    counter = 0;
    renderSearchBoxes();

    function renderSearchBoxes() {
        counter++
        console.log(counter);
        if (counter > boxesToRender) {
            return
        }
        $('.recent').append(recentView[counter - 1]);
        $(`.search-results-box${counter}`).animate({
            opacity: 1,
            height: "140px"
        }, 400);
        $(`.search-results-box${counter}`).promise().done(function () {
            renderSearchBoxes();
        });
    };
    $('.recent').on('click', '.download-doc', function () {  
        let nameOfSession =  $(this).attr("id");
        getDocument(nameOfSession);
})
}

function renderSearchResults(results) {  
    console.log(results);
    if (results === null || results === undefined) {
        $('.recent').empty();
        $('.recent').append('<div class="recent-view">No Results</div>');
    }
    $('.recent').empty();
    $('.recent').append('<div class="recent-view">No Results</div>');
    renderResults(results);
}

function renderRecent(results) {
    let results1 = results;
    console.log(results);
    $('.recent').empty();
    $('.recent').append('<div class="recent-view">Recent Uploads</div>');
    renderResults(results1);
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
            hideSearch();
            $('.recent').empty();
            let userUploads = results.map(function (data) {
                return `<p>${data.name}</p>`
            });
        });
    userUploads.forEach((data) => {
            $('.recent').append(data);
        })
        .fail(function (err) {
            alert('cannot get results for user:' + err);
        });
}

function getDocument (session) {
    console.log(state.currentRenderedResults);
    let thisSession = state.currentRenderedResults[session - 1].name;
    let thisProject = state.project;
    console.log(thisSession);
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

function hideSearch() {
    $('.search-bar').addClass('hidden');
}


function displaySearchPanel() {
    $('.recent').empty();
    $('.search-bar').removeClass('hidden');
    $('.js-first-search-button').click(function (e) {
        let searchTerm = $('#searchterm').val();
        console.log(searchTerm);
        e.preventDefault();
        getSearchResults(searchTerm);
        displaySearchResults();
    })

}

function addResultsToState(results) {  
    results.forEach((result) => {
        state.currentRenderedResults.push(result)
    })
}

function getSearchResults (searchTerm) {  
    console.log(searchTerm);
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
        console.log(results);
        renderResults(results);
    })
    .fail(function (err) {  
        alert('yo shit broke:' + err);
    });
}


function displaySearchResults() {
    renderRecent();
}

function renderUploadBox() {
    let uploadBox = `<div class="upload-box-bg">
        <div class="upload-box">Upload Transcription
        <form enctype="multipart/form-data" action="/transcriptions/upload/${state.loggedIn}" method="post" id="upload-box-form">
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
    $('.upload-box-bg').animate({
        opacity: 1
    }, 300);
    $('body').on('click', '#cancel-upload', function () {
        $('.upload-box-bg').animate({
            opacity: 0
        });
        $('.upload-box-bg').promise().done(() => {
            $('.upload-box-bg').remove();
        });
    });
}