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



function renderRecent() {
    //getRecentTranscripts();
    $('.recent').empty();
    let recentView = MOCK_DATA.map(function (data) {
        return `<p>${data.name}</p>`
    });
    $('.recent').text('Recent Uploads')
    recentView.forEach((data) => {
        $('.recent').append(data);
    });
}
//Event Listeners
$('.sign-in-button').click(function (e) {
    e.preventDefault();
    $('.sign-up-page').remove();
    $('.app-wrapper').removeClass('hidden');
    loginUser();
    renderRecent();
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
    renderRecent();
})

$('#help').on('click', function () {
    renderHelpBox();
})

$('.sign-up').on('click', function () {
    renderSignUpPage();
})

//-------

function loginUser(username, password) {
    if (username === undefined) {
        username = 'Chad';
        password = 'Avalon';
    } 
    console.log(username, password);
    $.ajax({
            type: "POST",
            url: "http://localhost:8080/users/login",
            headers: {
                'Authorization': 'Basic ' + btoa(username + ":" + password)
            },
            "data": "{\"username\": \"Chad\",\n\t\"password\": \"Avalon\"\n}"
             })
        .done(function (msg) {
            alert(`worked: ${msg}`);
            renderRecent();
        })
        .fail(function (err) {
            alert(`error ${err}`)
        })
}

function renderSignUpPage() {
    $('.sign-up-page').empty();
    let signUpPage = `<div class="new-signup-box">
            <form action="#" class="sign-up-form">
                <input type="text" id="new-username">
                <label for="username">Username</label>
                <input type="text" id="new-password">
                <label for="password">Password</label>
                </form>
                <button type="submit" class="new-sign-in-button">Sign Up</button>
        </div>`
    $('.sign-up-page').append(signUpPage);
    $('.sign-up-page').on('click', '.new-sign-in-button', function () {
        handleNewUser();
    })
}

function handleNewUser() {
    let pWord = $('#new-password').val();
    let uName = $('#new-username').val();
    console.log(uName);
    console.log(pWord);
    $.ajax({
            type: "POST",
            "processData": false,
            "data": `{\"username\": \"${uName}\",\n\t\"password\": \"${pWord}\"\n}`,
            url: 'http://localhost:8080/users',
            "headers": {
                "content-type": "application/json",
                "cache-control": "no-cache",
            },
        })
        .done(function (msg) {
            alert(`User saved: ${msg}`)
            loginUser(uName, pWord)
        })
        .fail(function (err) {
            alert(`error ${err}`)
        });
}


function renderMyUploads() {
    hideSearch();
    $('.recent').empty();
    let user = 'Jane Smith'
    let userUploads = MOCK_DATA.map(function (data) {
        if (user === data.uploadedBy) {
            return `<p>${data.name}</p>`
        }
    });
    userUploads.forEach((data) => {
        $('.recent').append(data);
    });
}

function renderHelpBox() {
    let helpBox = `<div class="help-box-wrapper">
    <div class="help-box">Transcriptor is a tool for those to store and search transcriptions.
    Transcriptor accepts word documents as file format.
    It can be used, for example, in qualitative research in the humanistic sciences when a team is transcribing interviews.
    </div>
    </div>`
    $('body').append(helpBox);
    $('body').on('click', '.help-box-wrapper', function () {
        $('.help-box-wrapper').remove();
    });
}

function hideSearch() {
    $('.search-bar').addClass('hidden');
}


function displaySearchPanel() {
    $('.recent').empty();
    $('.search-bar').removeClass('hidden');
    $('.js-first-search-button').click(function (e) {
        e.preventDefault();
        displaySearchResults();
    })

}

function displaySearchResults() {
    renderRecent();
}

function renderUploadBox() {
    let uploadBox = `<div class="upload-box-bg">
        <div class="upload-box">Upload Transcription
        <form enctype="multipart/form-data" action="/upload/doc" method="post">
        <input id="wordFile" type="file" />
        </form>
        </div>
        </div>`
    $('body').append(uploadBox);
    $('body').on('click', '.upload-box-bg', function () {
        $('.upload-box-bg').remove();
    });
}