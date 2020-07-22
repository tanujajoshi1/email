document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function archive(id) {
  fetch(`/emails/${id}`, {
  method: 'PUT',
  body: JSON.stringify({
      archived: true
  })
  })
  load_mailbox('inbox');
}

function unarchive(id) {
  fetch(`/emails/${id}`, {
  method: 'PUT',
  body: JSON.stringify({
      archived: false
  })
  })
  load_mailbox('inbox');
}

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#view-mail').style.display = 'none';
  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  const submit = document.querySelector('#send-form');
  const subject = document.querySelector('#compose-subject');
  const body = document.querySelector('#compose-body');
  const recipients = document.querySelector('#compose-recipients');

  submit.disabled = true;
  document.onkeyup = () => {
      if (recipients.value.length>0 && subject.value.length>0 && body.value.length>0) {
        submit.disabled = false;
      }
      else {
        submit.disabled = true;
      }
  }

  document.querySelector('form').onsubmit = function() {
                fetch('/emails', {
                  method: 'POST',
                  body: JSON.stringify({
                      recipients: recipients.value,
                      subject: subject.value,
                      body: body.value,
                      read: false,
                  })
                })
                .then(response => response.json())
                .then(result => {
                    if (result.message !== "Email sent successfully."){
                      alert(result.error)
                    }
                });
            };
}

function reply_mail(email) {
  let subject = email.subject;
  if (!subject.startsWith("Re:")){
    subject = `Re: ${subject}`
  }
  compose_email();
  document.querySelector('#compose-recipients').value = `${email.sender}`;
  document.querySelector('#compose-subject').value = `${subject}`;
  document.querySelector('#compose-body').value = `\nOn ${email.timestamp} ${email.sender} wrote:\n\n ${email.body}`;
}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#view-mail').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    emails.forEach(item => {
      const element = document.createElement('div');
      if (item.read===true) {
        element.setAttribute('class', "Email-Container-Read")
      }
      else {
        element.setAttribute('class', "Email-Container-NotRead")
      }
      element.innerHTML = `<div class="container" style="max-width:99%;"><div class="row"><div class="col-sm"><b> ${item.subject} </b></div><div class="col-sm"><p>From: ${item.sender} - ${item.timestamp}</p></div></div></div>`;
      element.addEventListener('click', () => view_mail(item.id,mailbox));
      document.querySelector('#emails-view').append(element);
      }
    );
  });
}

function view_mail(id,mailbox) {
  //hide other views
  document.querySelector('#view-mail').style.display = 'block';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  // set to read
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  })
  // display data
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    document.querySelector('#view-mail').innerHTML = `<h2>${email.subject}</h2><h4>Sender: ${email.sender}</h4><h4>Recipients: ${email.recipients}</h4><h6>${email.timestamp}</h6><br><div class=divider></div><br><span style="white-space: pre-line">${email.body}</span><div class=divider></div><br>`;
    if (!(mailbox==="sent")){
      const element = document.createElement('button');
      if (email.archived===false){
        element.setAttribute('class', "btn btn-sm btn-outline-success");
        element.innerHTML = "Archive";
        element.addEventListener('click', () => archive(`${email.id}`));
      }
      else{
        element.setAttribute('class', "btn btn-sm btn-outline-danger");
        element.innerHTML = "Unarchive";
        element.addEventListener('click', () => unarchive(`${email.id}`));
      }
      document.querySelector('#view-mail').append(element);
    }

    const newelement = document.createElement('button');
    newelement.setAttribute('class', "btn btn-sm btn-outline-primary");
    newelement.innerHTML = "Reply";
    newelement.addEventListener('click', () => reply_mail( email ));
    document.querySelector('#view-mail').append(newelement);
  });
}