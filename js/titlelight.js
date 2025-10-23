// var arr = ["#39c5bb", "#f14747", "#f1a247", "#f1ee47", "#b347f1", "#1edbff", "#ed709b", "#5636ed"],
//     idx = 0;
// function changeColor() {
//     "dark" == document.getElementsByTagName("html")[0].getAttribute("data-theme")
//         ? ((document.getElementsByClassName("site-name")[0].style.textShadow = arr[idx] + " 0 0 20px"),
//           (document.getElementById("site-title").style.textShadow = arr[idx] + " 0 0 20px"),
//           (document.getElementById("subtitle").style.textShadow = arr[idx] + " 0 0 20px"),
//           (document.getElementsByClassName("author-info__name")[0].style.textShadow = arr[idx] + " 0 0 15px"),
//           (document.getElementsByClassName("author-info__description")[0].style.textShadow = arr[idx] + " 0 0 15px"),
//           8 == ++idx && (idx = 0))
//         : ((document.getElementByClassName("site-name")[0].style.textShadow = "#1e1e1ee0 1px 1px 1px"),
//           (document.getElementById("site-title").style.textShadow = "#1e1e1ee0 1px 1px 1px"),
//           (document.getElementById("subtitle").style.textShadow = "#1e1e1ee0 1px 1px 1px"),
//           (document.getElementsByClassName("author-info__name")[0].style.textShadow = ""),
//           (document.getElementsByClassName("author-info__description")[0].style.textShadow = ""));
// }
// window.setInterval(changeColor, 1200);

var hue = 0;

function changeColor() {
    var color = `hsl(${hue}, 73%, 50%)`;
    hue = (hue + 6) % 360; // 色相值在0到360之间循环

    "dark" == document.getElementsByTagName("html")[0].getAttribute("data-theme")
        ? ((document.getElementById("site-name").style.textShadow = `${color} 0 0 16px`),
          (document.getElementsByClassName("author-info__name")[0].style.textShadow = `${color} 0 0 16px`),
          (document.getElementsByClassName("author-info__description")[0].style.textShadow = `${color} 0 0 16px`),
          (document.getElementById("site-title").style.textShadow = `${color} 0 0 20px`),
          (document.getElementById("subtitle").style.textShadow = `${color} 0 0 20px`))
        : ((document.getElementById("site-name").style.textShadow = "none"),
          (document.getElementsByClassName("author-info__name")[0].style.textShadow = ""),
          (document.getElementsByClassName("author-info__description")[0].style.textShadow = ""),
          (document.getElementById("site-title").style.textShadow = "2px 2px 4px rgba(0,0,0,0.15)"),
          (document.getElementById("subtitle").style.textShadow = "2px 2px 4px rgba(0,0,0,0.15)"));
}

window.setInterval(changeColor, 1000);
