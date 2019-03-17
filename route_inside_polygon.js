$(document).ready(function () {
  ymaps.ready(init);
});

function init() {
  var myMap = new ymaps.Map("map", {
    center: [59.939095, 30.315868],
    zoom: 9,
    controls: []
  }, {
      searchControlProvider: 'yandex#search'
    }),
  radioCars = document.querySelectorAll(".radio-car"),
  rangeGazelle = document.querySelector('.range-gazelle'),
  rangePuhto = document.querySelector('.range-puhto'),
  activeRange = null,
  rangeValue = document.querySelector('.range-value'),
  rangeCars = document.querySelectorAll('.range-car'),
  deliveryFrom = document.querySelector('.delivery__calculation__from'),
  price = 0,
  isKAD = false,
  distanceWay = 0;

  function changeRadioCar(isKAD, distance) {
    for (i = 0; i < radioCars.length; i++) {
      if (radioCars[i].checked) {
        var carChecked = radioCars[i];
        if (carChecked.value === 'gazelle') {
          rangePuhto.style.display = 'none';
          rangeGazelle.style.display = 'block';
          activeRange = 'gazelle';

          if (isKAD === true) {
            if (rangeGazelle.value <= 6) {
              price = 3500;
            }
            if (rangeGazelle.value >= 7 && rangeGazelle.value <= 12) {
              price = 5500;
            }
            if (rangeGazelle.value >= 13 && rangeGazelle.value <= 16) {
              price = 7000;
            }
          } else if (isKAD===false) {
            if (rangeGazelle.value <= 6) {
              price = 3500;
            }
            if (rangeGazelle.value >= 7 && rangeGazelle.value <= 12) {
              price = 5500;
            }
            if (rangeGazelle.value >= 13 && rangeGazelle.value <= 16) {
              price = 7000;
            }
            if (distance > 0) {
              price += distance * 50;
            }
          }
        } else {
          rangeGazelle.style.display = 'none';
          rangePuhto.style.display = 'block';
          activeRange = 'puhto';
          
          if (isKAD === true) {
            if (rangeGazelle.value <= 10) {
              price = 9000;
            }
            if (rangeGazelle.value >= 11 && rangeGazelle.value <= 14) {
              price = 1100;
            }
            if (rangeGazelle.value > 14 && rangeGazelle.value <= 27) {
              price = 14000;
            }
          } else if (isKAD === false) {
            if (rangeGazelle.value <= 10) {
              price = 9000;
            }
            if (rangeGazelle.value >= 11 && rangeGazelle.value <= 14) {
              price = 1100;
            }
            if (rangeGazelle.value > 14 && rangeGazelle.value <= 27) {
              price = 14000;
            }
            if (distance > 0) {
              price += distance * 150;
            }
          }
        }
      }
    }

    document.querySelector('.delivery__calculation__price').innerText = 'Итого: ' + price + ' ₽';
  }

  changeRadioCar();

  for (i = 0; i < radioCars.length; i++) {
    radioCars[i].addEventListener('change', function () {
      changeRadioCar(isKAD, distanceWay);
    })
  }

  for (let i = 0; i < rangeCars.length; i++) {
    const rangeCar = rangeCars[i];
    rangeCar.addEventListener('change', function () {
      if (activeRange === 'gazelle') {
        rangeValue.value = rangeGazelle.value + ' м³';
      } else {
        rangeValue.value = rangePuhto.value + ' м³';
      }
    })
  }
  
  function onPolygonLoad(json) {
    moscowPolygon = new ymaps.Polygon(json.coordinates);
    // Если мы не хотим, чтобы контур был виден, зададим соответствующую опцию.
    moscowPolygon.options.set('visible', false);
    // Чтобы корректно осуществлялись геометрические операции
    // над спроецированным многоугольником, его нужно добавить на карту.
    myMap.geoObjects.add(moscowPolygon);

    var searchControl = new ymaps.control.SearchControl({
      options: {
        provider: 'yandex#search'
      }
    });
    
    myMap.controls.add(searchControl);

    searchControl.events.add('resultselect', function (e) {

      var index = e.get('index');
      searchControl.getResult(index).then(function (res) {
        myMap.geoObjects.removeAll();
        myMap.geoObjects.add(moscowPolygon);
        var coords = res.geometry.getCoordinates();
        var myGeocoder = ymaps.geocode(coords);
        myGeocoder.then(
          function (res) {
            var firstGeoObject = res.geoObjects.get(0);
            deliveryFrom.innerText = firstGeoObject.getAddressLine();
          })

        ymaps
          .route([[59.939095, 30.315868], [coords[0].toPrecision(6), coords[1].toPrecision(6)]])
          .then(function (res) {

            // Объединим в выборку все сегменты маршрута.
            var pathsObjects = ymaps.geoQuery(res.getPaths()),
              edges = [];

            // Переберем все сегменты и разобьем их на отрезки.
            pathsObjects.each(function (path) {
              var coordinates = path.geometry.getCoordinates();
              for (var i = 1, l = coordinates.length; i < l; i++) {
                edges.push({
                  type: "LineString",
                  coordinates: [coordinates[i], coordinates[i - 1]],
                });
              }
            });


            isKAD = moscowPolygon.geometry.contains([coords[0].toPrecision(6), coords[1].toPrecision(6)]);

            distanceWay = parseInt(res.getHumanLength()); //Получаем расстояние
            changeRadioCar(isKAD, distanceWay);

            var controls = document.querySelectorAll(".radio-car");
            var rangeGazelle = document.querySelector('.range-gazelle');
            var rangePuhto = document.querySelector('.range-puhto');

            for (i = 0; i < controls.length; i++) {
              if (controls[i].checked) {
                var carChecked = controls[i];
                if (carChecked.value === 'gazelle') {
                  rangePuhto.style.display = 'none';
                  rangeGazelle.style.display = 'block';
                } else {
                  rangeGazelle.style.display = 'none';
                  rangePuhto.style.display = 'block';
                }
              }
            }

            // Создадим новую выборку, содержащую:
            // - отрезки, описываюшие маршрут;
            // - начальную и конечную точки;
            // - промежуточные точки.

            var routeObjects = ymaps
              .geoQuery(edges)
              .add(res.getWayPoints())
              .add(res.getViaPoints())
              .setOptions("strokeWidth", 3)
              .addToMap(myMap),
              // Найдем все объекты, попадающие внутрь КАД.
              objectsInMoscow = routeObjects.searchInside(moscowPolygon),
              // Найдем объекты, пересекающие КАД.
              boundaryObjects = routeObjects.searchIntersect(moscowPolygon);
            // Раскрасим в разные цвета объекты внутри, снаружи и пересекающие КАД.
            boundaryObjects.setOptions({
              strokeColor: "#006b52",
              preset: "islands#greenIcon"
            });
            objectsInMoscow.setOptions({
              strokeColor: "#002137",
              preset: "islands#redIcon"
            });
            // Объекты за пределами КАД получим исключением полученных выборок из
            // исходной.
            routeObjects
              .remove(objectsInMoscow)
              .remove(boundaryObjects)
              .setOptions({
                strokeColor: "#006b52",
                preset: "islands#blueIcon",
              });
          });
      });
      searchControl.clear();
    });

    // -------------

    myMap.events.add('click', function (e) {
      
      if (!myMap.balloon.isOpen()) {
        myMap.geoObjects.removeAll();
        myMap.geoObjects.add(moscowPolygon);
        var coords = e.get('coords');

        var myGeocoder = ymaps.geocode(coords);
        myGeocoder.then(
          function (res) {
            var firstGeoObject = res.geoObjects.get(0);
            deliveryFrom.innerText = firstGeoObject.getAddressLine();
          })

        ymaps
          .route([[59.939095, 30.315868], [coords[0].toPrecision(6), coords[1].toPrecision(6)]])
          .then(function (res) {
            
            // Объединим в выборку все сегменты маршрута.
            var pathsObjects = ymaps.geoQuery(res.getPaths()),
              edges = [];
            
            // Переберем все сегменты и разобьем их на отрезки.
            pathsObjects.each(function (path) {
              var coordinates = path.geometry.getCoordinates();
              for (var i = 1, l = coordinates.length; i < l; i++) {
                edges.push({
                  type: "LineString",
                  coordinates: [coordinates[i], coordinates[i - 1]],
                });
              }
            });
           

            isKAD = moscowPolygon.geometry.contains([coords[0].toPrecision(6), coords[1].toPrecision(6)]);

            distanceWay = parseInt(res.getHumanLength()); //Получаем расстояние
            changeRadioCar(isKAD, distanceWay);

            var controls = document.querySelectorAll(".radio-car");
            var rangeGazelle = document.querySelector('.range-gazelle');
            var rangePuhto = document.querySelector('.range-puhto');

            for (i = 0; i < controls.length; i++) {
              if (controls[i].checked) {
                var carChecked = controls[i];
                if (carChecked.value === 'gazelle') {
                  rangePuhto.style.display = 'none';
                  rangeGazelle.style.display = 'block';
                } else {
                  rangeGazelle.style.display = 'none';
                  rangePuhto.style.display = 'block';
                }
              }
            }

            // Создадим новую выборку, содержащую:
            // - отрезки, описываюшие маршрут;
            // - начальную и конечную точки;
            // - промежуточные точки.
          
            var routeObjects = ymaps
              .geoQuery(edges)
              .add(res.getWayPoints())
              .add(res.getViaPoints())
              .setOptions("strokeWidth", 3)
              .addToMap(myMap),
              // Найдем все объекты, попадающие внутрь КАД.
              objectsInMoscow = routeObjects.searchInside(moscowPolygon),
              // Найдем объекты, пересекающие КАД.
              boundaryObjects = routeObjects.searchIntersect(moscowPolygon);
            // Раскрасим в разные цвета объекты внутри, снаружи и пересекающие КАД.
            boundaryObjects.setOptions({
              strokeColor: "#006b52",
              preset: "islands#greenIcon"
            });
            objectsInMoscow.setOptions({
              strokeColor: "#002137",
              preset: "islands#redIcon"
            });
            // Объекты за пределами КАД получим исключением полученных выборок из
            // исходной.
            routeObjects
              .remove(objectsInMoscow)
              .remove(boundaryObjects)
              .setOptions({
                strokeColor: "#006b52",
                preset: "islands#blueIcon",
              });
          });

        function changeRange(value) {
          var rangeValue = document.querySelector('.range-value');
          rangeValue.value = value + 'м³';
        }
      }
      else {
        myMap.balloon.close();
      }
    });

    //---------------

   
    
  }

  $.ajax({
    url: 'moscow.json',
    dataType: 'json',
    success: onPolygonLoad
  });


  
}
