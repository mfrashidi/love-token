var mainPanelAppeared = false;
var persianNumbers = {0: '۰', 1: '۱', 2: '۲', 3: '۳', 4: '۴', 5: '۵', 6: '۶', 7: '۷', 8: '۸', 9: '۹' };
let name;
let symbol;
let loveHour;
let loveMinute;
let friend;
let e;

Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

function pad(num, size) {
    num = num.toString();
    var finalNum = "";
    for (let i = 0; i < num.length; i++) {
        finalNum += persianNumbers[num.charAt(i)];
    }
    while (finalNum.length < size) finalNum = "۰" + finalNum;
    return finalNum;
}

function initToast() {
    try {
        window.toast.name;
        updateContractInfo();
    } catch (error) {
        setTimeout(() => {
            initToast();
        }, 100);
    }
}

function showMainPanel() {
    setInterval(updateTime, 1000);
    setInterval(updateWeather, 60000);
    document.getElementById('quote').style.opacity = '0';
    setTimeout(() => {
        document.getElementById('quote').style.display = 'none';
        document.getElementById('main-panel').style.display = 'flex';
        $('#contract-address').text(contractAddress);
        $("#contract-address").attr("href", "https://sepolia.etherscan.io/address/" + contractAddress);
        setTimeout(() => {
            document.getElementById('main-panel').style.opacity = '1';
        }, 100);
    }, 1000);
}

function updateTime() {
    var loveHour = $('#token-hour').text();
    var loveMinute = $('#token-minute').text();

    var currentTime = new Date();
    if (currentTime.getHours().toString() == loveHour && currentTime.getMinutes().toString() == loveMinute) {
        $('.countdown').hide();
        $('.love-banner').show();
    } else {
        $('.countdown').show();
        $('.love-banner').hide();

        var tmpTime = new Date();
        tmpTime.setHours(loveHour, loveMinute, 0, 0);
        if (tmpTime - currentTime < 0) {
            tmpTime = tmpTime.addDays(1);
        }
        var remainingTime = Math.floor((tmpTime - currentTime) / 1000);
    
        var hours = Math.floor(remainingTime / 3600);
        var minutes = Math.floor((remainingTime % 3600) / 60);
        var seconds = remainingTime % 60;
    
        $('#hours').text(pad(hours, 2));
        $('#minutes').text(pad(minutes, 2));
        $('#seconds').text(pad(seconds, 2));
    }
}

async function updateWalletInfo() {
    try {
        var currentToast = window.toast.loading('...در حال دریافت دیتای ولت', { duration: 100000000 });

        let wallet = await signer.getAddress();
        $('#wallet-address').text(wallet);
        $("#wallet-address").attr("href", "https://sepolia.etherscan.io/address/" + wallet);

        let balance = await provider.getBalance(wallet);
        balance = (balance / 1000000000000000000).toFixed(5);
        $('#wallet-balance').text(balance.toString() + " sETH");

        let tolBalance = await contract.balanceOf(wallet);
        $('#wallet-tol-balance').text(tolBalance.toNumber() + " " + symbol);

        friend = (await contract.friendOf(wallet)).toString();
        let friendText;
        if (friend === '0x0000000000000000000000000000000000000000') {
            friendText = "تنهای تنهای تنها";
            $("#wallet-friend").attr("href", "https://lonelynotalone.org/");
        } else {
            friendText = friend;
            $("#wallet-friend").attr("href", "https://sepolia.etherscan.io/address/" + friend);
        }
        $('#wallet-friend').text(friendText);

        document.getElementById('metamask-connect').style.display = 'none';
        document.getElementById('wallet-info').style.display = 'block';

        window.toast.dismiss(currentToast);
        window.toast.success("دیتای ولت دریافت شد");
    } catch (error) {
        window.toast.dismiss(currentToast);
        window.toast.error("دریافت دیتا با خطا مواجه شد");
        console.error('Error:', error);
    }
}

async function updateContractInfo() {
    try {
        var currentToast = window.toast.loading('...در حال دریافت دیتای قرارداد', { duration: 100000000 });

        name = await contract.name();
        symbol = await contract.symbol();
        loveHour = await contract.loveHour();
        loveMinute = await contract.loveMinute();
        updateWeather(false);

        $('#token-name').text(name.toString());
        $('#token-symbol').text(symbol.toString());
        $('#token-hour').text(loveHour.toString());
        $('#token-minute').text(loveMinute.toString());
        window.toast.dismiss(currentToast);

        window.toast.success("دیتای قرارداد دریافت شد");
        if (!mainPanelAppeared) {
            showMainPanel();
            mainPanelAppeared = true;
        }

        return true;
    } catch (error) {
        window.toast.dismiss(currentToast);
        window.toast.error("دریافت دیتا با خطا مواجه شد");
        console.error('Error calling contract function:', error);
        return false;
    }
}

async function updateWeather(showToast=false) {
    try {
        if (showToast)
            var currentToast = window.toast.loading('...در حال دریافت دیتای آب و هوا', { duration: 100000000 });

        var isRainy = await contract.isRainy();
        var updateTime = (await contract.isRainyModifiedAt()).toNumber() * 1000;
        var updateTimeStr = new Intl.DateTimeFormat('fa-IR', {dateStyle: 'full', timeStyle: 'long'}).format(updateTime);
        $('#weather-info').attr('data-tooltip', updateTimeStr);
        if (isRainy) {
            $('#weather-info').text('بارانی');
            $('#rainy-animation').css('display', 'block');
            $('#sunny-animation').css('display', 'none');
        } else {
            $('#weather-info').text('صاف');
            $('#rainy-animation').css('display', 'none');
            $('#sunny-animation').css('display', 'block');
        }

        if (showToast) {
            window.toast.dismiss(currentToast);
            window.toast.success("دیتای آب و هوا آپدیت شد");
        }

        return true;
    } catch (error) {
        if (showToast) {
            window.toast.dismiss(currentToast);
            window.toast.error("دریافت دیتا با خطا مواجه شد");
        }
        console.error('Error calling contract function:', error);
        return false;
    }
}

async function connectMetaMask() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            const metamaskProvider = new ethers.providers.Web3Provider(window.ethereum);
            signer = metamaskProvider.getSigner();
            contract = new ethers.Contract(contractAddress, contractABI, signer);
            console.log("MetaMask connected");
            updateWalletInfo();
        } catch (error) {
            console.error("User denied account access", error);
            window.toast.error("کاربر اجازه دسترسی نداد");
        }
    } else {
        window.toast.error("متامسک نصب نمی‌باشد");
    }
}

async function requestFriendship(address) {
    try {
        const tx = await contract.weAreFriends(address);
        var currentToast = window.toast.loading('...در حال ثبت تراکنش در بلاکچین', { duration: 100000000 });
        await tx.wait();
        console.log("Transaction successful", tx);
        window.toast.dismiss(currentToast);
        window.toast.success("درخواست دوستی ارسال شد");
        updateWalletInfo();
    } catch (error) {
        window.toast.dismiss(currentToast);
        if (error.error) {
            if (error.error.message === 'execution reverted: Are you non-monogamous?') {
                window.toast.error("آزادگان به عشق خیانت نمی کنند");
            } else {
                window.toast.error(error.error.message);
            }
        } else {
            console.log(error);
            window.toast.error("تراکنش با مشکل دچار شد");
        }
    }
}

async function thoughtOfThem() {
    try {
        const tx = await contract.thoughtOfThem();
        var currentToast = window.toast.loading('...در حال ثبت تراکنش در بلاکچین', { duration: 100000000 });
        await tx.wait();
        console.log("Transaction successful", tx);
        window.toast.dismiss(currentToast);
        window.toast.success("محبت ارسال شد");
        updateWalletInfo();
    } catch (error) {
        window.toast.dismiss(currentToast);
        if (error.error) {
            if (error.error.message === 'execution reverted: You are not on time my friend') {
                window.toast.error("زمان عاشقی فرا نرسیده است");
            } else if (error.error.message=== 'execution reverted: You are single my friend') {
                window.toast.error("فکر کدام یار هستی؟");
            } else {
                window.toast.error(error.error.message);
            }
        } else {
            console.log(error);
            window.toast.error("تراکنش با مشکل دچار شد");
        }
    }
}

async function transfer(address, amount) {
    try {
        const tx = await contract.transfer(address, amount);
        var currentToast = window.toast.loading('...در حال ثبت تراکنش در بلاکچین', { duration: 100000000 });
        await tx.wait();
        console.log("Transaction successful", tx);
        window.toast.dismiss(currentToast);
        window.toast.success("توکن ارسال شد");
        updateWalletInfo();
    } catch (error) {
        window.toast.dismiss(currentToast);
        if (error.error) {
            if (error.error.message === 'execution reverted: arithmetic underflow or overflow') {
                window.toast.error("موجودی کافی نمی‌باشد");
            } else {
                window.toast.error(error.error.message);
            }
        } else {
            console.log(error);
            window.toast.error("تراکنش با مشکل دچار شد");
        }
    }
}

async function cut() {
    try {
        const tx = await contract.weCut();
        var currentToast = window.toast.loading('...در حال ثبت تراکنش در بلاکچین', { duration: 100000000 });
        await tx.wait();
        console.log("Transaction successful", tx);
        window.toast.dismiss(currentToast);
        window.toast.success("به خداحافظی تلخ تو سوگند، نشد");
        updateWalletInfo();
    } catch (error) {
        e = error;
        window.toast.dismiss(currentToast);
        if (error.error) {
            if (error.error.message === 'execution reverted: You are single my friend') {
                window.toast.error("جدایی از کدام یار؟");
            } else {
                window.toast.error(error.error.message);
            }
        } else {
            console.log(error);
            window.toast.error("تراکنش با مشکل دچار شد");
        }
    }
}

async function askOut() {
    try {
        const tx = await contract.askToGoOut();
        var currentToast = window.toast.loading('...در حال ثبت تراکنش در بلاکچین', { duration: 100000000 });
        await tx.wait();
        console.log("Transaction successful", tx);
        window.toast.dismiss(currentToast);
        window.toast.success("!ببار ای باران، ببااار");
        updateWalletInfo();
    } catch (error) {
        window.toast.dismiss(currentToast);
        if (error.error) {
            switch(error.error.message) {
                case 'execution reverted: You are single my friend':
                    window.toast.error("با کدام یار زیر باران؟");
                    break;
                case 'execution reverted: Weather data is out of date':
                    window.toast.error("دیتای آب و هوا آپدیت نمی‌باشد");
                    break;
                case 'execution reverted: It\'s not raining':
                    window.toast.error("!آسمان صاف صاف است");
                    break;
                case 'execution reverted: Wait my friend. Too soon to go another date':
                    window.toast.error("به تازگی به دیدار یار رفتی");
                    break;
                default:
                    window.toast.error(error.error.message);
            }
        } else {
            console.log(error);
            window.toast.error("تراکنش با مشکل دچار شد");
        }
    }
}

initToast();

$('#metamask-connect').click(function(){
    connectMetaMask();
});

$('#reload-wallet').click(function(){
    updateWalletInfo();
});

$('#reload-contract').click(function(){
    updateContractInfo();
});

$('#reload-weather').click(function(){
    updateWeather(true);
});

$('.request-button').click(function(){
    let friendAddress = $('#friend-request-address').val();
    if (ethers.utils.isAddress(friendAddress)) {
        if (signer) {
            requestFriendship(friendAddress);
        } else {
            window.toast.error("ولت متصل نمی‌باشد");
        }
    } else {
        window.toast.error("آدرس یار صحیح نمی‌باشد");
    }
});

$('.tought-button').click(function(){
    if (signer) {
        thoughtOfThem();
    } else {
        window.toast.error("ولت متصل نمی‌باشد");
    }
});

$('.cut-button').click(function(){
    if (signer) {
        cut();
    } else {
        window.toast.error("ولت متصل نمی‌باشد");
    }
});

$('.ask-out-button').click(function(){
    if (signer) {
        askOut();
    } else {
        window.toast.error("ولت متصل نمی‌باشد");
    }
});


$('.token-button').click(function(){
    let friendAddress = $('#token-transfer-address').val();
    if (ethers.utils.isAddress(friendAddress)) {
        if (signer) {
            let amount = $('#token-transfer-amount').val();
            if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
                window.toast.error("مقدار صحیح نمی‌باشد");
            } else {
                transfer(friendAddress, amount);
            }
        } else {
            window.toast.error("ولت متصل نمی‌باشد");
        }
    } else {
        window.toast.error("آدرس دوست صحیح نمی‌باشد");
    }
});

var sunnyAnimation = bodymovin.loadAnimation({
    container: document.getElementById('sunny-animation'),
    path: './img/sunny.json',
    renderer: 'svg',
    loop: true,
    autoplay: true,
    name: "Sunny Animation",
});