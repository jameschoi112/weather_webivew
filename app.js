const apiKey = '2630650eb643159d28e9c376363973e8';  // OpenWeatherMap API 키를 여기에 입력하세요
const defaultLat = 37.29225652; // 경기도 수원시의 위도
const defaultLon = 127.0701028; // 경기도 수원시의 경도

document.addEventListener('DOMContentLoaded', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            getWeatherData(lat, lon);
        }, error => {
            console.error('위치 정보를 가져오는 도중 오류가 발생했습니다:', error);
            alert('위치 정보를 가져오는 도중 오류가 발생했습니다. 경기도 수원시의 날씨 정보를 표시합니다.');
            getWeatherData(defaultLat, defaultLon);
        });
    } else {
        alert('위치 정보를 사용할 수 없습니다. 경기도 수원시의 날씨 정보를 표시합니다.');
        getWeatherData(defaultLat, defaultLon);
    }

    // 현재 시간 업데이트 함수 호출
    updateCurrentTime();
    setInterval(updateCurrentTime, 60000); // 매 분마다 시간 업데이트
});

async function getWeatherData(lat, lon) {
    const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=kr`;
    const forecastWeatherUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=kr`;

    try {
        const [currentWeatherResponse, forecastWeatherResponse] = await Promise.all([
            fetch(currentWeatherUrl),
            fetch(forecastWeatherUrl)
        ]);

        if (!currentWeatherResponse.ok) {
            throw new Error(`Current weather data fetch failed: ${currentWeatherResponse.statusText}`);
        }

        if (!forecastWeatherResponse.ok) {
            throw new Error(`Forecast weather data fetch failed: ${forecastWeatherResponse.statusText}`);
        }

        const currentWeatherData = await currentWeatherResponse.json();
        const forecastWeatherData = await forecastWeatherResponse.json();

        // 콘솔에 응답 데이터 출력
        console.log('Current Weather Data:', currentWeatherData);
        console.log('Forecast Weather Data:', forecastWeatherData);

        displayCurrentWeather(currentWeatherData, forecastWeatherData);
        displayHourlyWeather(forecastWeatherData);
        displayForecastWeather(forecastWeatherData);

        // 데이터 로드 후 로딩 스피너를 숨기고 날씨 정보를 표시
        document.getElementById('loading-spinner').style.display = 'none';
        document.getElementById('weather-container').style.display = 'block';
    } catch (error) {
        console.error('날씨 데이터를 가져오는 도중 오류가 발생했습니다:', error);
        document.getElementById('loading-spinner').style.display = 'none';
        alert('날씨 데이터를 가져오는 도중 오류가 발생했습니다.');
    }
}

function displayCurrentWeather(currentData, forecastData) {
    const location = document.getElementById('location');
    const temperature = document.getElementById('temperature');
    const highLow = document.getElementById('high-low');
    const currentIcon = document.getElementById('current-icon');
    const currentTimeElement = document.getElementById('current-time');

    if (currentData && currentData.name && currentData.sys && currentData.main) {
        location.textContent = `${currentData.name}, ${currentData.sys.country}`;
        temperature.textContent = `${Math.round(currentData.main.temp)}도`;
        currentIcon.src = `https://openweathermap.org/img/wn/${currentData.weather[0].icon}.png`;
    } else {
        console.error('Current weather data is not in expected format:', currentData);
    }

    // 현재 시간에 가장 가까운 예측 데이터로 최고 및 최저 온도 계산
    if (forecastData && forecastData.list) {
        const now = new Date();
        const todayForecasts = forecastData.list.filter(item => {
            const forecastTime = new Date(item.dt_txt);
            return forecastTime.getDate() === now.getDate();
        });

        if (todayForecasts.length > 0) {
            const temps = todayForecasts.map(item => item.main.temp);
            const maxTemp = Math.max(...temps);
            const minTemp = Math.min(...temps);
            highLow.textContent = `최고: ${Math.round(maxTemp)}°C / 최저: ${Math.round(minTemp)}°C`;
        }
    } else {
        console.error('Forecast weather data is not in expected format:', forecastData);
    }

    // 현재 시간 표시
    updateCurrentTime();

    console.log('Current Weather Displayed');
}

function displayHourlyWeather(data) {
    const hourlyWeather = document.getElementById('hourly-weather');
    hourlyWeather.innerHTML = ''; // 기존 내용을 비웁니다.

    if (data && data.list) {
        const now = new Date();
        const currentHour = now.getHours();

        data.list.forEach(item => {
            const forecastTime = new Date(item.dt_txt);
            if (forecastTime.getHours() >= currentHour) {
                const hourDiv = document.createElement('div');
                hourDiv.className = 'flex flex-col items-center p-2 bg-pink-opacity rounded-lg min-w-[80px]';
                const hours = forecastTime.getHours();
                hourDiv.innerHTML = `
                    <p>${hours < 10 ? '0' + hours : hours}시</p>
                    <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png" class="weather-icon" alt="weather icon">
                    <p>${Math.round(item.main.temp)}°C</p>
                `;
                hourlyWeather.appendChild(hourDiv);
            }
        });
    } else {
        console.error('Hourly weather data is not in expected format:', data);
    }

    console.log('Hourly Weather Displayed');
}

function displayForecastWeather(data) {
    const forecastWeather = document.getElementById('forecast-weather');
    forecastWeather.innerHTML = ''; // 기존 내용을 비웁니다.

    if (data && data.list) {
        // 날짜별로 데이터를 그룹화합니다.
        const days = {};

        data.list.forEach(item => {
            const date = new Date(item.dt_txt).getDate();
            if (!days[date]) {
                days[date] = [];
            }
            days[date].push(item);
        });

        // 각 날짜에 대해 최고 온도와 최저 온도를 계산합니다.
        Object.keys(days).forEach(date => {
            const dayData = days[date];
            const temps = dayData.map(item => item.main.temp);
            const maxTemp = Math.max(...temps);
            const minTemp = Math.min(...temps);
            const weatherIcon = dayData[0].weather[0].icon;

            const dayDiv = document.createElement('div');
            dayDiv.className = 'flex items-center justify-between p-2 bg-pink-opacity rounded-lg';
            const displayDate = new Date(dayData[0].dt_txt);
            const dayOfWeek = displayDate.toLocaleDateString('ko-KR', { weekday: 'short' }); // 요일 추가
            dayDiv.innerHTML = `
                <p>${displayDate.getMonth() + 1}월 ${displayDate.getDate()}일 (${dayOfWeek})</p>
                <img src="https://openweathermap.org/img/wn/${weatherIcon}.png" class="weather-icon" alt="weather icon">
                <p>${Math.round(maxTemp)}°C / ${Math.round(minTemp)}°C</p>
            `;
            forecastWeather.appendChild(dayDiv);
        });
    } else {
        console.error('Forecast weather data is not in expected format:', data);
    }

    console.log('Forecast Weather Displayed');
}

function updateCurrentTime() {
    const currentTimeElement = document.getElementById('current-time');
    const now = new Date();
    const options = { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    currentTimeElement.textContent = now.toLocaleTimeString('ko-KR', options);
}
