document.addEventListener('DOMContentLoaded', function () {

  // Mobile menu
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('mainNav');

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      nav.classList.toggle('open');
    });
  }

  // Auto-dismiss alerts
  document.querySelectorAll('.alert').forEach(function (el) {
    setTimeout(function () {
      el.style.transition = 'opacity 0.5s ease';
      el.style.opacity = '0';

      setTimeout(function () {
        el.remove();
      }, 500);

    }, 4000);
    
  });
  // Admin sidebar toggle

var adminToggle = document.getElementById('adminToggle');
var adminSidebar = document.querySelector('.admin-sidebar');

if(adminToggle && adminSidebar){

    adminToggle.addEventListener('click', function(){

        adminSidebar.classList.toggle('open');

    });

}
});
// Initialize AOS

AOS.init({
    duration:900,
    once:true,
    offset:80
});


// Navbar Animation

window.addEventListener("scroll",()=>{

const header=document.querySelector(".site-header");

if(window.scrollY>40){

header.classList.add("scrolled");

}

else{

header.classList.remove("scrolled");

}

});


