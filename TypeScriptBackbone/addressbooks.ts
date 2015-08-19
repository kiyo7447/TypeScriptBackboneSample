/// <reference path="scripts/typings/unitepos/unitepos.d.ts" />

/*

HTML1300: ナビゲーションが発生しました。
ファイル: localhost:32921
Address.constructor1
	ModelCommon.constructor1
		ModelBase.constructor1

		Address.defaults
			ModelCommon.defaults
				ModelBase.defaults

		Address.initialize1
			ModelCommon.initialize1
				ModelBase.initialize1
				ModelBase.initialize2
			ModelCommon.initialize2
		Address.initialize2

		ModelBase.constructor2
	ModelCommon.constructor2

	model name:ddddddd
	model test:Address test data
	model testbase:ModelBase test data
	model testcommon:ModelCommon test data

Address.constructor2

 */
class ModelBase extends Backbone.Model {

	defaults() {
		console.log("ModelBase.defaults");
		return {
			testbase: "ModelBase test data"
		};
	}

	constructor(options?) {
		console.log("ModelBase.constructor1");
		super(options);
		console.log("ModelBase.constructor2");
	}

	initialize(model) {
		console.log("ModelBase.initialize1");
		//
		console.log("ModelBase.initialize2");
	}

	baseMethod(msg: string): string {
		return msg + ":base ok";
	}


}


class ModelCommon extends ModelBase {
	defaults() {
		console.log("ModelCommon.defaults");
		return _.defaults({
			testcommon: "ModelCommon test data"
		}, _.result(ModelBase.prototype,"defaults"));
	}

	constructor(options?) {
		console.log("ModelCommon.constructor1");
		super(options);
		console.log("ModelCommon.constructor2");
	}

	initialize(model) {
		console.log("ModelCommon.initialize1");
		super.initialize(model);
		console.log("ModelCommon.initialize2");
	}

	commonMethod(msg: string): string {
		return msg + ":common ok";
	}
}


class ViewBase<ModelBase extends Backbone.Model> extends Backbone.View<Backbone.Model> {
	constructor(options?) {
		console.log("ViewBase.constructor1");
		super(options);
		console.log("ViewBase.constructor2");
	}
}

class ViewCommon<ModelCommon> extends ViewBase<ModelBase> {
	constructor(options?) {
		super(options);
	}
}


//Backbone.Modelを継承したAddressクラスを定義
class Address extends ModelCommon {
	//デフォルト値
	defaults() {
		console.log("Address.defaults");

		//親の値は使わない
		//return {
		//	name: "",
		//	test: "Address test data"
		//};

		//サイト通りにやったが継承はしない
		//http://tsmd.hateblo.jp/entry/2013/03/21/183311
		return _.defaults({
			name: "",
			test: "Address test data"
		}, _.result(ModelCommon.prototype, "defaults"));
	}

	//初期化
	constructor(options?) {
		console.log("Address.constructor1");
		super(options);
		if (!this.get("name")) {
			this.set({ name: this.defaults().name });
		}

		console.log("model name:" + this.get("name"));
		console.log("model test:" + this.get("test"));
		console.log("model testbase:" + this.get("testbase"));
		console.log("model testcommon:" + this.get("testcommon"));

		console.log("Address.constructor2");
	}

	initialize(model) {
		console.log("Address.initialize1");
		super.initialize(model);
		console.log("Address.initialize2");
	}

	
	//バリデーション
	//http://qiita.com/yuku_t/items/cdffdff4ddb74747be7e
	validate(attributes) {
		var errors = [];

		var name = attributes.name;
		if (!name || name === this.defaults().name) {
			//return "Error!";
			errors.push({ attr:"name", message:"入力値が空です。"});
		}
		
		if (errors.length) return errors;	
	}

	//test method
	abe() {
		this.baseMethod("");
	}
}


//
class AddressCollection extends Backbone.Collection<Address>
{
	model = Address;
		
	//addressbook-sampleというキーでlocalStorageを使う
	localStorage = new Store("addressbook-sample");

}



var g_Addresses = new AddressCollection();

class AddressView<T extends ModelCommon> extends ViewCommon<ModelCommon> {
	
	model: T;
	input: JQuery;

	constructor(options?) {
		this.tagName = "li";

		//TODO:これが無くてなぜ動作する？？
		//this.className = "address-item";

		//イベントハンドラの設定				
		this.events =  <any>{
			"dblclick label.name": "_rename",
			"click button.delete": "_clear"
		};

		super(options);

		this.model.bind("change", this._render, this);
		this.model.bind("destroy", this.remove, this);

		this.model.bind("invalid", this._renderMessage, this);
	}


	_render() {
		//jquery.d.tsをNuGetで取得して対応
		var e = $('<label class="name">').text(this.model.get('name'));
		$(this.el).html(e[0].outerHTML).append("<button class='delete'>Delete</button>");

		//正常系は前回のエラーをクリア
		$("#msg").html("").hide();
		return this;
	}

	//d,eは空です。
	_renderMessage(a, errors,c,d,e) {
		var es = a.validationError;
		_.each(errors,(e:any) => {
			if (e.attr === "name") {
				//TODO:えらーを表示できない
				//this.$("#msg").html(e.message).show();
				//↓  this.があると何が変わるのか？
				$("#msg").html(e.message).show();
			}
		});
	}

	_rename() {
		var newName = window.prompt("新しい名前を入力してください。", this.model.get("name"));
		this.model.save("name", newName);
	}

	_clear() {
		this.model.destroy();
	}
}

//AddressView.prototype.events => {};

class AppView<T extends ModelCommon> extends ViewCommon<ModelCommon> {

	//events = {
	//	"keypress #new-address": "_keyPress",
	//	"click #delete-all": "_deleteAll"
	//};
	input: JQuery;
	model: T;				

	constructor(options?) {
		this.events = <any>{
				"keypress #new-address": "_keyPress",
				"click #delete-all": "_deleteAll"
			};

		super(options);

		//対象の画面
		this.setElement($("#app"), true);
		//↑を↓に変換したが動作しなかった。
		//this.el = $("#app")[0];


		//入力テキストコントロールのイベントを拾う
		this.input = this.$("#new-address");

		
		g_Addresses.bind("add", this._add, this);
		g_Addresses.bind("reset", this._addAll, this);
		g_Addresses.fetch();

		
	}

	_add(address: Address) {

		var param: Backbone.ViewOptions<Address> = { model: address};

		var view: AddressView<T> = new AddressView<T>(param);
		this.$("#list").append(view._render().el);

	}


	_addAll() {
		g_Addresses.each(this._add);
		//this.model.each(this._add);

	}

	_keyPress(e) {
		if (e.keyCode === 13) {
			//Enterキーが押されたらモデルを追加する
			g_Addresses.create({ name: this.input.val()});
			this.input.val("");
		}
	}

	_deleteAll(e) {
		var address: Address;
		while (address = g_Addresses.first()) {
			address.destroy();
		}
	}
}

$(() => {

	new AppView({ model: g_Addresses });


	var dec: { [key: string]: string; } = {};

	dec["a"] = "1";
	dec["b"] = "33";

	console.log("a:" + dec["a"]);
	//1

	console.log("none:" + dec["hogehoge"]);
	//undefined

	_.each(dec,(v) => {
		console.log("each:" + v);
	});
	//1, 33


});



//---------------------------------------------------------------------
/*
class Todo extends Backbone.Model {

	defaults() {
		return {

		}
	}

	initialize() {
	}

	toggle() {

	}

	clear() {

	}
}


class TodoList extends Backbone.Collection<Todo> {

}

class TodoView extends Backbone.View<Todo> {

	event: Backbone.Events;

	constructor(options?: Backbone.ViewOptions<Todo>) {
		super(options);
	}

	method1() {


	}

}

*/
