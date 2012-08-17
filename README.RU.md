# Базовая реализация MVC для backbone.js

Backbone.Application - это простая и эффективная реализация MVC паттерна для backbone.js. В основе всего 2 новых класса, которые доступны в неймспейсе Backbone:
* Backbone.Application
* Backbone.Controller

# Как использовоть
## Определяем конструктор приложения
### Автоматическое создание пространства имён для нашего приложения
Для начала, создадим наше приложение. `Backbone.Application` умеет автоматически генерировать скелет, определяя пространство имён, в котором будут определены все будущие компоненты и классы. Рассмотрим как это работает на простом примере.
```Javascript
new Backbone.Application({
	nameSpace: 'SteakMaker'
});
```
В результате, мы получим готовую структуру, в которой будет сосредоточены все компоненты нашего приложения. Выглядит она вот так:
```Javascript
window.SteakMaker = {
    ...
    Controllers: {},
    Models: {},
    Collections: {}
}

```
`window.SteakMaker` и есть экземпляр еашего приложения. Давайте убедимся в этом:
```Javascript
console.log(SteakMaker instanceof Backbone.Application); // -> true
```

Приложение автоматически определит пространство имён на основании параметра `nameSpace` и создаст объекты-заглушки, где мы сможем определить все необходимые конструкторы и любые другие объекты. Внутренняя структура конфигурируется при помощи свойства 'allocationMap'. Его значения по умолчанию:
```Javascript
allocationMap: {
    model: 'Models',
    collection: 'Collections',
    controller: 'Controllers',
    view: 'Views'
}
```

Поля `model`, `collection`, `controller` и `view` являются обязательными. Можно переопределить и расширить пространство имён, используя альтернативные значения для `allocationMap`. Например:
```Javascript
new Backbone.Application({
    ...    
    allocationMap: {
        model: 'models',
        collection: 'stores',
        controller: 'controllers',
        view: 'views',
        lib: 'libs'
    }
});
```
В результате мы получим вот такую структуру на выходе
```Javascript
window.SteakMaker = {
    controllers: {},
    models: {},
    stores: {},
    libs: {}
}
```
##### Важно
Чтобы воспользоваться преимуществом атоматичского создания пространства имён необходимо создать экземпляр приложения самым первым, ещё до того, как загрузились все остальные компоненты. 

### Объявляем внутренние компоненты
Немного расширим наш пример и добавим несколько контроллеров.
```Javascript
new Backbone.Application({
	nameSpace: 'SteakMaker',
	
	controllers: [
		'MeatManager',      // -> SteakMaker.Controllers.MeatManager
		'Administration',   // -> SteakMaker.Controllers.Administration
        ...
	]
});
```
Обратите внимание, объявляя список контроллеров, мы используем строковый идентификатор, который не содержит `SteakMaker.Controllers`. Опираясь на свойство `nameSpace`, приложение автоматически попробует найти ссылки на нужные классы. Фактически это означает, что в дальнейшем, при объявлении наших компонентов, мы должны использовать выбраный неймспейс. Например:
```Javascript
SteakMaker.Controllers.Administration = Backbone.Controller.extend({});
SteakMaker.Models.Steak = Backbone.Model.extend({});
SteakMaker.Views.Kitchen = Backbone.View.extend({});
```

## Определяем контроллер
После того, как мы создали наше приложение, можно приступать к контроллерам, которые свяжут все части воедино. Их основная задача - слушать события (как правило, от созданных view и других контроллеров) и реагировать соотвествующиим образом.
```Javascript
SteakMaker.Controllers.MeatManager = Backbone.Controller.extend({
	models: [
		'Meat',
		...
	],
	collections: [
		'Dishes',
		...
	],
	views: [
		'Kitchen',
		...
	],
    
    initialize: function() {
        ...
    }
});
```

Функция `Controller.initialize` - это отличное место, чтобы подписаться на события и определить, какие действия должны быть выполнены в результаты.
 Для этого используем функцию `Controller.addListeners`, передав в неё список компонентов и событий. В нашем примере, мы будем слушать событие `'toolbar.action'`, которое генерирует компонент `Kitchen`:
```Javascript
SteakMaker.Controllers.MeatManager = Backbone.Controller.extend({
	...		
	initialize: function() {
		this.addListeners({
			'Kitchen': {
				'toolbar.action': this.toolbarAction
			}
		});
	},
	
	toolbarAction: function(action) {
		// code here
	}
});
```

У каждого контроллера есть callback `onLauch`, который можно использовать для начала работы. Давайте создадим модель `Meat`, компонент `Kitchen` и отрендерим его на странице сразу после старта приложения.
```Javascript
SteakMaker.Controllers.MeatManager = Backbone.Controller.extend({
	...		
	onLaunch: function() {
		var model = this.getModel('Meat');
		var view = this.createView('Kitchen', {
			model: model
		});
		
		view.render();
	}
	...
});
```

## Определение view
Во многом, работа с компонентами ничем не отличается от оригинального [Backbone.View](http://backbonejs.org/#View), но есть небольшие и важные отличия. Для того, чтобы дать возможность отслеживать события на уровне контроллера, был добавлен метод `View.fireEvent`. Именно он оповестит все подписанные контроллеры о том, что произошло какое-то событие. Давайте посмотрим, как это работает в нашем примере. Пусть компонент сгенерирует событие `'toolbar.action'` и оповестит контроллер `MeatManager`.
```Javascript
SteakMaker.Views.Kitchen = Backbone.View.extend({
	events: {
		'click .toolbar button': 'onToolbarButtonClick'
	},
	...		
	onToolbarButtonClick: function(event) {
		var button = $(event.currentTarget),
			action = button.data('action');
			
		this.fireEvent('toolbar.action', [action]);
	}
	...
});
```
Теперь все контроллеры могут подписаться на события от `Kitchen` и реагировать соотвествущим образом.

##Примеры