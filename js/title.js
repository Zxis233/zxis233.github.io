document.addEventListener("visibilitychange", function () {
    if (document.visibilityState == "hidden") {
        normal_title = document.title;
        let titleState = 0;
        titleInterval = setInterval(() => {
            document.title = titleState == 2 ? " Ciallo~ (∠・ω< )⌒★!" : titleState == 1 ? "♪~(¯◡◝)  啥时再来看看我 ..." : normal_title;
            titleState = titleState == 2 ? 0 : titleState + 1;
        }, 8000);
    } else {
        if (titleInterval) {
            clearInterval(titleInterval);
            document.title = normal_title;
        }
    }
});
