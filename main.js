var typed = new Typed(".text", {
    strings: ["Front-end Developer", "Web Developer", "C-coder", "Python-coder"],
    typeSpeed: 100,
    backSpeed: 90,
    backDelay: 1000,
    loop: true
});

document.getElementById('email-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    var form = this;
    var formData = new FormData(form);

    fetch("https://formspree.io/f/xqazzgoz", {
        method: "POST",
        body: formData,
        headers: {
            'Accept': 'application/json'
        }
    }).then(response => {
        if (response.ok) {
            alert("Thanks for your submission!");
            form.reset();
        } else {
            response.json().then(data => {
                if (Object.hasOwn(data, 'errors')) {
                    alert(data["errors"].map(error => error["message"]).join(", "));
                } else {
                    alert("Oops! There was a problem submitting your form");
                }
            });
        }
    }).catch(error => {
        alert("Oops! There was a problem submitting your form");
    });
});
