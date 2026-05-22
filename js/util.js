window.CCH_UTIL = {
    date: new Date(),
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    monthArr: Array.from({length: 12}, (_, i) => i + 1),
    yearArr: Array.from({length: new Date().getFullYear() - 2023 + 1}, (_, i) => 2023 + i),
    selectboxState: {},
    tabType: "CHEESE"
};

async function initHistory() {
    document.body.style.overflow = "hidden";
    document.getElementById("closeModalBtn").addEventListener("click", () => {
        closeCheeseHistoryModal();
    });

    document.getElementById("cheeseHistoryModal").addEventListener("click", (e) => {
        if(e.target.id === "cheeseHistoryModal") {
            closeCheeseHistoryModal();
        }
    });

    document.addEventListener("keydown", (e) => {
        if(e.key === "Escape") {
            closeCheeseHistoryModal();
        }
    });

    chgCalendarYear(CCH_UTIL.year);
    chgCalendarMonth(CCH_UTIL.month);
    
    document.querySelectorAll(".cch_selectbox_component").forEach((element) => {
        const key = element.dataset.key;
        CCH_UTIL.selectboxState[key] = false;
        element.addEventListener("focus", handleFocusChange);
        element.addEventListener("blur", handleFocusChange);
    });

    let year_selectbox_items = ``;
        for(let year of CCH_UTIL.yearArr) {
            year_selectbox_items += `<li class="cch_selectbox_item">
                <button type="button" class="cch_selectbox_option" onclick="chgCalendarYear(${year});">${year}년</button>
            </li>`;
        }
        document.querySelector(".calendar_year_selectbox").innerHTML = year_selectbox_items;

    let month_selectbox_items = ``;
    for(let month of CCH_UTIL.monthArr) {
        month_selectbox_items += `<li class="cch_selectbox_item">
            <button type="button" class="cch_selectbox_option" onclick="chgCalendarMonth(${month});">${month}월</button>
        </li>`;
    }
    document.querySelector(".calendar_month_selectbox").innerHTML = month_selectbox_items;
    
    initCheeseApi();
};

function handleFocusChange(event) {
    const element = event.target;
    const key = element.dataset.key;

    if(!key) return;

    if(event.type === "focus") {
        element.classList.add("cch_selectbox_is_focused");
        document.querySelector(`.${key}_selectbox`).dataset.visible = "block";
    } else if(event.type === "blur") {
        element.classList.remove("cch_selectbox_is_focused");
        setTimeout(function() {
            document.querySelector(`.${key}_selectbox`).dataset.visible = "none";
        }, 100);
    }
}

function chgTab(type) {
    if(CCH_UTIL.tabType === type) return;

    CCH_UTIL.tabType = type;
    chgView("Channel");
    document.getElementById("totalPayAmount").innerText = "조회중";
    document.getElementById("channelListContainer").innerHTML = "";

    if(type === "CHEESE") {
        document.getElementById("cheeseTab").classList.add("on");
        document.getElementById("subscriptionTab").classList.remove("on");
        document.querySelector("label[for='sortTotal']").innerText = "후원금액순";

        initCheeseApi();
    } else if(type === "SUBSCRIPTION") {
        document.getElementById("cheeseTab").classList.remove("on");
        document.getElementById("subscriptionTab").classList.add("on");
        document.querySelector("label[for='sortTotal']").innerText = "구독선물 횟수순";

        initSubscriptionApi();
    }
}

function chgView(type) {
    if(type !== "Channel") {
        if(CCH_UTIL.tabType === "CHEESE") {
            if(CCH.channel == null) {
                alert("조회할 채널을 선택해주세요.");
                return;
            }
        } else if(CCH_UTIL.tabType === "SUBSCRIPTION") {
            if(CSH.channel == null) {
                alert("조회할 채널을 선택해주세요.");
                return;
            }
        }
    }

    if(type === "Channel") {
        moveChannelView(true);
        moveGraphView(false);
        moveCalendarView(false);
    } else if(type === "Graph") {
        moveChannelView(false);
        moveGraphView(true);
        moveCalendarView(false);
    } else if(type === "Calendar") {
        moveChannelView(false);
        moveGraphView(false);
        moveCalendarView(true);
    }
}

function chgCalendarYear(yearParam) {
    document.getElementsByClassName("cch_selectbox_inner")[0].innerHTML = `${yearParam}년` + returnSelectboxIconArrow();
    CCH_UTIL.year = yearParam;
}

function chgCalendarMonth(monthParam) {
    document.getElementsByClassName("cch_selectbox_inner")[1].innerHTML = `${monthParam}월` + returnSelectboxIconArrow();
    CCH_UTIL.month = monthParam;
}

function changeSortType() {
    if(CCH_UTIL.tabType === "CHEESE") {
        document.getElementById("channelListContainer").innerHTML = makeCheeseList(CCH.channels);
    } else if(CCH_UTIL.tabType === "SUBSCRIPTION") {
        document.getElementById("channelListContainer").innerHTML = makeSubscriptionList(CSH.channels);
    }
}

function moveChannelView(flag) {
    if(flag) {
        document.getElementById("channelBtn").classList.add("on");
        document.getElementById("cch_channelList").dataset.visible = "block";
        document.getElementById("totalContainer").dataset.visible = "flex";
    } else {
        document.getElementById("channelBtn").classList.remove("on");
        document.getElementById("cch_channelList").dataset.visible = "none";
        document.getElementById("totalContainer").dataset.visible = "none";
    }
}

function moveGraphView(flag) {
    if(flag) {
        document.getElementById("graphBtn").classList.add("on");
        document.getElementById("channelHistory").dataset.visible = "block";
    } else {
        document.getElementById("graphBtn").classList.remove("on");
        document.getElementById("channelHistory").dataset.visible = "none";
    }
}

function moveCalendarView(flag) {
    if(flag) {
        document.getElementById("calendarBtn").classList.add("on");
        document.getElementById("channelHistoryCalendar").dataset.visible = "block";
        document.querySelector(".cch_selectbox").dataset.visible = "block";
    } else {
        document.getElementById("calendarBtn").classList.remove("on");
        document.getElementById("channelHistoryCalendar").dataset.visible = "none";
        document.querySelector(".cch_selectbox").dataset.visible = "none";
    }
}

function chgCalendarDate(yearParam, monthParam, focusDay) {
    CCH_UTIL.year = yearParam;
    CCH_UTIL.month = monthParam;
    
    document.getElementsByClassName("cch_selectbox_inner")[0].innerHTML = `${CCH_UTIL.year}년` + returnSelectboxIconArrow();
    document.getElementsByClassName("cch_selectbox_inner")[1].innerHTML = `${CCH_UTIL.month}월` + returnSelectboxIconArrow();
    
    if(CCH_UTIL.tabType === "CHEESE") {
        rendarCheeseCalendar(focusDay);
    } else if(CCH_UTIL.tabType === "SUBSCRIPTION") {
        rendarSubscriptionCalendar(focusDay);
    }
}

function goPrev() {
    CCH_UTIL.month--;
    if(CCH_UTIL.month <= 0) CCH_UTIL.month = 12, CCH_UTIL.year -= 1;

    chgCalendarDate(CCH_UTIL.year, CCH_UTIL.month, null);
}

function goNext() {
    CCH_UTIL.month++;
    if(CCH_UTIL.month > 12) CCH_UTIL.month = 1, CCH_UTIL.year++;

    chgCalendarDate(CCH_UTIL.year, CCH_UTIL.month, null);
}

function goDate(date) {
    let splitedDate = date.split('-');

    chgCalendarDate(Number(splitedDate[0]), Number(splitedDate[1]), Number(splitedDate[2]));
}

function goToday() {
    let today = new Date();
    CCH_UTIL.year = today.getFullYear();
    CCH_UTIL.month = today.getMonth() + 1;

    chgCalendarDate(CCH_UTIL.year, CCH_UTIL.month, null);
}

function makeDate(year, month, date) {
    return `${year}-${month < 10 ? '0' + month : month}-${date < 10 ? '0' + date : date}`;
}

function returnSelectboxIconArrow() {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10" fill="none" class="cch_selectbox_icon_arrow">
        <path fill="currentColor" fill-rule="evenodd" d="M.21 2.209a.715.715 0 0 1 1.01 0L5 5.983 8.78 2.21a.715.715 0 0 1 1.01 0 .712.712 0 0 1 0 1.008L5 8 .21 3.217a.712.712 0 0 1 0-1.008Z" clip-rule="evenodd"></path>
    </svg>`;
}

function closeCheeseHistoryModal() {
    document.getElementById("cheeseHistoryModal")?.remove();
    document.body.style.overflow = "";
}
function rendarCalendar() {
    if(CCH_UTIL.tabType === "CHEESE") {
        rendarCheeseCalendar();
    } else if(CCH_UTIL.tabType === "SUBSCRIPTION") {
        rendarSubscriptionCalendar();
    }
}

initHistory();