$(document).ready(function () {
  ymaps.ready(init);
});

function init() {
  var myMap = new ymaps.Map("map", {
    center: [59.939095, 30.315868],
    zoom: 9
  }, {
      searchControlProvider: 'yandex#search'
    }),
    moscowPolygon,
    
    // Создадим панель маршрутизации.
    routePanelControl = new ymaps.control.RoutePanel({
      options: {
        // Добавим заголовок панели.
        showHeader: true,
        title: "Расчёт доставки"
      }
    });



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
                  coordinates: [coordinates[i], coordinates[i - 1]]
                });
              }
            });
            // Получим ссылку на маршрут.
            routePanelControl.routePanel.getRouteAsync().then(function (route) {

              // Повесим обработчик на событие построения маршрута.
              res.model.events.add('requestsuccess', function () {

                var activeRoute = res.getActiveRoute();
                if (activeRoute) {
                  // Получим протяженность маршрута.
                  var length = res.getActiveRoute().properties.get("distance"),
                    // Вычислим стоимость доставки.
                    price = calculate(Math.round(length.value / 1000)),
                    // Создадим макет содержимого балуна маршрута.
                    balloonContentLayout = ymaps.templateLayoutFactory.createClass(
                      '<span>Расстояние: ' + length.text + '.</span><br/>' +
                      '<span style="font-weight: bold; font-style: italic">Стоимость доставки: ' + price + ' р.</span>');
                  // Зададим этот макет для содержимого балуна.
                  res.options.set('routeBalloonContentLayout', balloonContentLayout);
                }
              });

            });
            // Функция, вычисляющая стоимость доставки.
            function calculate(routeLength) {
              return Math.max(routeLength * DELIVERY_TARIFF, MINIMUM_COST);
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
              strokeColor: "#06ff00",
              preset: "islands#greenIcon"
            });
            objectsInMoscow.setOptions({
              strokeColor: "#ff0005",
              preset: "islands#redIcon"
            });
            // Объекты за пределами КАД получим исключением полученных выборок из
            // исходной.
            routeObjects
              .remove(objectsInMoscow)
              .remove(boundaryObjects)
              .setOptions({
                strokeColor: "#0010ff",
                preset: "islands#blueIcon"
              });
          });
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
