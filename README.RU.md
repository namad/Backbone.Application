# Базовая реализация MVC для backbone.js

Backbone.Application - это простая и эффективная реализация MVC паттерна для backbone.js. В основе всего 2 новых класса, которые доступны в неймспейсе Backbone:
* Backbone.Application
* Backbone.Controller

# Как использовоть
## Определяем конструктор приложения
### Автоматическое создание пространства имён для нашего приложения
Для начала, опишем наше приложение. Начнём с простого объявления. `Backbone.Application` умеет автоматически создавать скелет, определяя пространство имён, в котором будут храниться как конструкторы для всех сущностей, так и все созданные объекты. Рассмотрим как это работает на простом примере.
```Javascript
new Backbone.Application({
	name: 'app',
	nameSpace: 'FormBuilder'
});
```
В результате, мы получим готовую структуру, в которой будет сосредоточены все компоненты нашего приложения. Выглядит она вот так:
```Javascript
window.FormBuilder = {
    app: Backbone.Application, // это не что иное, как экземпляр нашего приложения
    Controllers: {},
    Models: {},
    Collections: {}
}
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
window.FormBuilder = {
    app: Backbone.Application, // это не что иное, как экземпляр нашего приложения
    controllers: {},
    models: {},
    stores: {},
    libs: {}
}
```

### Объявляем внутренние компоненты
Немного расширим наш пример и добавим несколько контроллеров.
```Javascript
new Backbone.Application({
	name: 'app',
	nameSpace: 'FormBuilder',
	
	controllers: [
		'FormManager',
		'Administration',
        ...
		'service.RunTime'
	]
});
```
Обратите внимание, объявляя список контроллеров, мы используем строковый идентификатор, который не содержит `FormBuilder.Controllers`. Опираясь на свойство `nameSpace`, приложение автоматически попробует найти нужные классы. Фактически это означает, что в дальнейшем, при объявлении наших компонентов, мы будем использовать выбраный неймспейс. Например:
```Javascript
_FormBuilder.Controllers_.service.RunTime = Backbone.Controller.extend({});
_FormBuilder.Models_.Form = Backbone.Model.extend({});
_FormBuilder.Views_.Form = Backbone.View.extend({});
```

## Определяем контроллер
После того, как мы создали наше приложение, можно приступать к контроллерам, которые свяжут все части воедино. Их основная задача - слушать события (как правило, от созданных view и других контроллеров) и предпренимать соотвествующие действия.
```Javascript
FormBuilder.Controllers.UserManager = Backbone.Controller.extend({
	models: [
		'FormBuilder.Models.Form',
		...
	],
	collections: [
		'FormBuilder.Collections.Forms',
		...
	],
	views: [
		'FormBuilder.Views.FormManager',
		...
	]
});
```

Функция `Controller.initialize` - это отличное место, чтобы подписаться на события и определить, какие действия должны быть выполнены в результаты.
 Для этого используем функцию `Controller.addListeners`, передав в неё список компонентов и событий. В нашем примере, мы будем слушать событие `'toolbar.action'`, которое генерирует компонент `FormManager`:
```Javascript
FormBuilder.Controllers.UserManager = Backbone.Controller.extend({
	...		
	initialize: function() {
		this.addListeners({
			'FormManager': {
				'toolbar.action': this.toolbarAction
			}
		});
	},
	
	toolbarAction: function(action) {
		// code here
	}
});
```

У каждого контроллера есть callback `onLauch`, который можно использовать для начала работы. Давайте создадим модель `Form`, компонент `FormManager` и отрендерим его на странице.
```Javascript
FormBuilder.Controllers.UserManager = Backbone.Controller.extend({
	...		
	onLaunch: function() {
		var formModel = this.getModel('Form');
		var formView = this.createView('FormManager', {
			model: formModel
		});
		
		formView.render();
	}
	...
});
```

## Определение view
ВО многом, работа с компонентами ничем не отличается от оригинального [Backbone.View](http://backbonejs.org/#View), но есть небольшие и важные отличия. Для того, чтобы дать возможность отслеживать события на уровне контроллера, был добавлен метод `View.fireEvent`. Именно он оповестит все подписанные контроллеры о том, что произошло какое-то событие. Давайте посмотрим, как это работает в нашем примере. Пусть компонент сгенерирует событие `'toolbar.action'` и оповестит контроллер `UserManager`.
```Javascript
FormBuilder.Views.FormManager = Backbone.View.extend({
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
Теперь все контроллеры могут подписаться на события от `FormManager` и реагировать соотвествущим образом.

## Запуск приложения
После того, как все ключевые части определены, можно запускать наше приложение
```Javascript
new FormBuilder.Application();
```
Ура! Новый экземпляр нашего приложения готов рулить и разруливать :)