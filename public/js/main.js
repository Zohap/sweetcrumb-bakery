document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('mainNav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      nav.classList.toggle('open');
    });
  }

  // Auto-dismiss alerts after a few seconds
  document.querySelectorAll('.alert').forEach(function (el) {
    setTimeout(function () {
      el.style.transition = 'opacity 0.5s ease';
      el.style.opacity = '0';
      setTimeout(function () { el.remove(); }, 500);
    }, 4000);
  });
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


// Stagger Product Cards

const cards=document.querySelectorAll(".product-card");

cards.forEach((card,index)=>{

card.style.animationDelay=`${index*0.08}s`;

});