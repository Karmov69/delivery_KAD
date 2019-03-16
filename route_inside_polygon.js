$(document).ready(function () {
  ymaps.ready(init);
  console.log('Жора блять гаси микрозаймы');
  
});

function init() {
  var myMap = new ymaps.Map("map", {
    center: [59.939095, 30.315868],
    zoom: 9,
    controls:[]
  }, {
      searchControlProvider: 'yandex#search'
    }),

  radioCars = document.querySelectorAll(".radio-car"),
  rangeGazelle = document.querySelector('.range-gazelle'),
  rangePuhto = document.querySelector('.range-puhto'),
  activeRange = null,
  rangeValue = document.querySelector('.range-value'),
  rangeCars = document.querySelectorAll('.range-car'),
  price = 0,
  distance = 0;

  function changeRadioCar(isKAD, distance) {
    for (i = 0; i < radioCars.length; i++) {
      if (radioCars[i].checked) {
        var carChecked = radioCars[i];
        if (carChecked.value === 'gazelle') {
          console.log('gazelle checked');
          rangePuhto.style.display = 'none';
          rangeGazelle.style.display = 'block';
          activeRange = 'gazelle';
          price = 0;
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
          console.log('puhto checked');
          rangeGazelle.style.display = 'none';
          rangePuhto.style.display = 'block';
          activeRange = 'puhto';
          price = 0;
          if (isKAD === true) {
            if (rangeGazelle.value <= 10) {
              price = 9000;
            }
            if (rangeGazelle.value >= 11 && rangeGazelle.value <= 14) {
              price = 5500;
            }
            if (rangeGazelle.value >= 13 && rangeGazelle.value <= 16) {
              price = 7000;
            }
          } else if (isKAD === false) {
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
        }
      }
    }

    console.log('ЦЕНА = ', price);
    document.querySelector('.delivery__calculation__price').innerText = 'Итого: ' + price + ' ₽';
  }

  changeRadioCar();

  for (i = 0; i < radioCars.length; i++) {
    radioCars[i].addEventListener('change', function () {
      changeRadioCar();
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

    
    // -------------
    
    myMap.events.add('click', function (e) {
      
      if (!myMap.balloon.isOpen()) {
        myMap.geoObjects.removeAll();
        myMap.geoObjects.add(moscowPolygon);
        var coords = e.get('coords');
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
            
           
            var isKAD = moscowPolygon.geometry.contains([coords[0].toPrecision(6), coords[1].toPrecision(6)]);

            var distance = parseInt(res.getHumanLength()); //Получаем расстояние
            changeRadioCar(isKAD, distance);

            var controls = document.querySelectorAll(".radio-car");
            var rangeGazelle = document.querySelector('.range-gazelle');
            var rangePuhto = document.querySelector('.range-puhto');

            for (i = 0; i < controls.length; i++) {
              if (controls[i].checked) {
                var carChecked = controls[i];
                if (carChecked.value === 'gazelle') {
                  console.log('gazelle checked');
                  rangePuhto.style.display = 'none';
                  rangeGazelle.style.display = 'block';
                } else {
                  console.log('puhto checked');
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
