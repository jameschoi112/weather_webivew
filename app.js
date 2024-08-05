const apiKey = '2630650eb643159d28e9c376363973e8';  // OpenWeatherMap API 키를 여기에 입력하세요
const defaultLat = 37.2636; // 경기도 수원시의 위도
const defaultLon = 127.0286; // 경기도 수원시의 경도

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

        displayCurrentWeather(currentWeatherData);
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

function displayCurrentWeather(data) {
    const location = document.getElementById('location');
    const temperature = document.getElementById('temperature');
    const highLow = document.getElementById('high-low');
    const currentIcon = document.getElementById('current-icon');

    if (data && data.name && data.sys && data.main) {
        location.textContent = `${data.name}, ${data.sys.country}`;
        temperature.textContent = `${Math.round(data.main.temp)}°C`;
        highLow.textContent = `최고: ${Math.round(data.main.temp_max)}°C / 최저: ${Math.round(data.main.temp_min)}°C`;
        currentIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}.png`;
    } else {
        console.error('Current weather data is not in expected format:', data);
    }

    console.log('Current Weather Displayed');
}

function displayHourlyWeather(data) {
    const hourlyWeather = document.getElementById('hourly-weather');
    hourlyWeather.innerHTML = ''; // 기존 내용을 비웁니다.

    if (data && data.list) {
        data.list.slice(0, 24).forEach(item => { // 1시간 단위로 변경
            const hourDiv = document.createElement('div');
            hourDiv.className = 'flex flex-col items-center p-2 bg-pink-100 rounded-lg min-w-[80px]'; // 아이템의 최소 너비 설정
            const time = new Date(item.dt_txt).getHours();
            hourDiv.innerHTML = `
                <p>${time}시</p>
                <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png" class="weather-icon" alt="weather icon">
                <p>${Math.round(item.main.temp)}°C</p>
            `;
            hourlyWeather.appendChild(hourDiv);
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
        for (let i = 0; i < data.list.length; i += 8) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'flex items-center justify-between p-2 bg-pink-100 rounded-lg';
            const date = new Date(data.list[i].dt_txt);
            dayDiv.innerHTML = `
                <p>${date.getMonth() + 1}월 ${date.getDate()}일</p>
                <img src="https://openweathermap.org/img/wn/${data.list[i].weather[0].icon}.png" class="weather-icon" alt="weather icon">
                <p>${Math.round(data.list[i].main.temp_max)}°C / ${Math.round(data.list[i].main.temp_min)}°C</p>
            `;
            forecastWeather.appendChild(dayDiv);
        }
    } else {
        console.error('Forecast weather data is not in expected format:', data);
    }

    console.log('Forecast Weather Displayed');
}
