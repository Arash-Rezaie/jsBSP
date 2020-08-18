$(document).ready(function (e) {
    try {
        $(".icon-dropdown").msDropDown();
    } catch (e) {
        alert(e.message);
    }
});