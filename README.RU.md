# Базовая реализация MVC для backbone.js

Backbone.Application - это простая и эффективная реализация MVC паттерна для backbone.js. В основе всего 2 новых класса, которые доступны в неймспейсе Backbone:
* Backbone.Application
* Backbone.Controller

# Как использовоть
## Определяем пространство имён для будущего приложения
Перед тем, как начать создавать наше приложение, мы определим базовое пространство имём, где будут определены все ключевые компоненты. Допустим, мы создаём приложение FormBuilder, скелет может выглядеть вот так:
```Javascript
var FormBuilder = {
	Controllers: {},
	Models: {},
	Views: {},
	Collections: {}
}
```
## Определяем конструктор приложения
Для начала, опишем наше приложение. Свойство `nameSpace` укажет на базовое пространство имём, где оно будет существовать после создания, а свойство `name` определит ключ, по которому мы можем получить ссылку на эксземпляр.
```Javascript
FormBuilder.Application = Backbone.Application.extend({
	name: 'app',
	nameSpace: 'FormBuilder',
	
	controllers: [
		'FormBuilder.Controllers.FormManager',
		'FormBuilder.Controllers.Administration',
		'FormBuilder.Controllers.RunTime'
	]
});
```
В результате, мы всегда сможем обратится к приложению из глобального пространства имём используя переменную `FormBuilder.app`


## Определяем контроллер
Чтобы связать части приложения воедино, нам нужны контроллеры. Их основная задача - слушать события (как правило, от созданных view и других контроллеров) и предпренимать соотвествующие действия.
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