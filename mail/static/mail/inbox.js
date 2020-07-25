document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);


  // By default, load the inbox
  load_mailbox('inbox');
 
});



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
      if (recipients.value.length>0 && body.value.length>0) {        
          submit.disabled = false;               
      }
      else 
        submit.disabled = true;      
  }
  document.querySelector('form').onsubmit = function(event) {
    event.preventDefault();
                fetch('/emails', {
                  method: 'POST',
                  body: JSON.stringify({
                      recipients: recipients.value,
                      subject: subject.value,
                      body: body.value,
                      read: false,
                  }),
                })
                .then(response => response.json())
                .then((result) => {         

                      if(result.message !== "Email sent successfully."){
                      alert(result.error)
                    }
                   else {
                  load_mailbox('sent');
                   }       
                });
              };
}




function reply_email(email) {
  var subject = email.subject;
  if (!subject.startsWith("Re:")){
    subject = `Re: ${subject}`
  }
  compose_email();
  document.querySelector('#compose-recipients').value = `${email.sender}`;
  document.querySelector('#compose-subject').value = `${subject}`;
  document.querySelector('#compose-body').value = `\nOn ${email.timestamp} ${email.sender} wrote: \n${email.body}....`;
}



function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#view-mail').style.display = 'none';
  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>  ${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {    
       let count=0;
    emails.forEach(item => {
      const element = document.createElement('div');
      count++;

      if (item.read===true) {
      element.setAttribute('class', "Email-Container-Read");      
      element.innerHTML = `<div class="container" style="max-width:99%;"><div class="card" style="padding:10px;background-color:gray;"><div class="col-sm"><i class="fas fa-envelope-open-text fa-1x"></i><b> ${item.subject} </b></div><div class="col-sm"><p>From: ${item.sender} - ${item.timestamp}</p></div></div><br/></div>`;
      element.addEventListener('click', () => view_email(item.id,mailbox));
      document.querySelector('#emails-view').append(element);     
      if(mailbox==='inbox'){
      count--;
      document.querySelector("#count").innerHTML=count;
    }    
     }

      else {
        element.setAttribute('class', "Email-Container-NotRead");        
        document.querySelector("#count").innerHTML=count;
        element.innerHTML = `<div class="container" style="max-width:99%;"><div class="card" style="padding:10px;"><div class="col-sm"><i class="fas fa-envelope-open-text fa-1x"></i><b> ${item.subject} </b></div><div class="col-sm"><p>From: ${item.sender} - ${item.timestamp}</p></div></div><br/></div>`;
        element.addEventListener('click', () => view_email(item.id,mailbox));
        document.querySelector('#emails-view').append(element);
      }
   
      });
  });
}

function view_email(id,mailbox) {
  document.querySelector('#view-mail').style.display = 'block';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
 
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  })
 
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    document.querySelector('#view-mail').innerHTML = `<div class="card" style="padding:30px;"><h2>${email.subject}</h2>
    <div class="card" id="#card">
    <h4>From: ${email.sender}</h4><h4>
    To: ${email.recipients}</h4><small>${email.timestamp}</small></div><br>
    <div class=divider></div><div class=divider></div><br><span style="white-space: pre-line" id="span">${email.body}</span>
    <div class=divider></div><br></card>`;
    if (mailbox!="sent"){
      const element = document.createElement('button');
      if (email.archived===false){
        element.setAttribute('class', "btn btn-sm btn-success");      
        element.innerHTML = "Archive <i class='fa fa-plus'></i>";
        element.addEventListener('click', () => archive(`${email.id}`));
      }
      else{
        element.setAttribute('class', "btn btn-sm btn-danger");
        element.innerHTML = "Unarchive";
        element.addEventListener('click', () => unarchive(`${email.id}`));
      }
      document.querySelector('#view-mail').append(element);
    }

    const newelement = document.createElement('button');
    newelement.setAttribute('class', "btn btn-sm btn-primary");
    newelement.innerHTML = "Reply  <i class='fa fa-reply'></i>";
    newelement.addEventListener('click', () => reply_email( email ));
    document.querySelector('#view-mail').append(newelement);
  });
}

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