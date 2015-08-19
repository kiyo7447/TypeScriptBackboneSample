/// <reference path="scripts/typings/unitepos/unitepos.d.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
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
var ModelBase = (function (_super) {
    __extends(ModelBase, _super);
    function ModelBase(options) {
        console.log("ModelBase.constructor1");
        _super.call(this, options);
        console.log("ModelBase.constructor2");
    }
    ModelBase.prototype.defaults = function () {
        console.log("ModelBase.defaults");
        return {
            testbase: "ModelBase test data"
        };
    };
    ModelBase.prototype.initialize = function (model) {
        console.log("ModelBase.initialize1");
        //
        console.log("ModelBase.initialize2");
    };
    ModelBase.prototype.baseMethod = function (msg) {
        return msg + ":base ok";
    };
    return ModelBase;
})(Backbone.Model);
var ModelCommon = (function (_super) {
    __extends(ModelCommon, _super);
    function ModelCommon(options) {
        console.log("ModelCommon.constructor1");
        _super.call(this, options);
        console.log("ModelCommon.constructor2");
    }
    ModelCommon.prototype.defaults = function () {
        console.log("ModelCommon.defaults");
        return _.defaults({
            testcommon: "ModelCommon test data"
        }, _.result(ModelBase.prototype, "defaults"));
    };
    ModelCommon.prototype.initialize = function (model) {
        console.log("ModelCommon.initialize1");
        _super.prototype.initialize.call(this, model);
        console.log("ModelCommon.initialize2");
    };
    ModelCommon.prototype.commonMethod = function (msg) {
        return msg + ":common ok";
    };
    return ModelCommon;
})(ModelBase);
//Backbone.Modelを継承したAddressクラスを定義
var Address = (function (_super) {
    __extends(Address, _super);
    //初期化
    function Address(options) {
        console.log("Address.constructor1");
        _super.call(this, options);
        if (!this.get("name")) {
            this.set({ name: this.defaults().name });
        }
        console.log("model name:" + this.get("name"));
        console.log("model test:" + this.get("test"));
        console.log("model testbase:" + this.get("testbase"));
        console.log("model testcommon:" + this.get("testcommon"));
        console.log("Address.constructor2");
    }
    //デフォルト値
    Address.prototype.defaults = function () {
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
    };
    Address.prototype.initialize = function (model) {
        console.log("Address.initialize1");
        _super.prototype.initialize.call(this, model);
        console.log("Address.initialize2");
    };
    //バリデーション
    //http://qiita.com/yuku_t/items/cdffdff4ddb74747be7e
    Address.prototype.validate = function (attributes) {
        var errors = [];
        var name = attributes.name;
        if (!name || name === this.defaults().name) {
            //return "Error!";
            errors.push({ attr: "name", message: "入力値が空です。" });
        }
        if (errors.length)
            return errors;
    };
    //test method
    Address.prototype.abe = function () {
        this.baseMethod("");
    };
    return Address;
})(ModelCommon);
//
var AddressCollection = (function (_super) {
    __extends(AddressCollection, _super);
    function AddressCollection() {
        _super.apply(this, arguments);
        this.model = Address;
        //addressbook-sampleというキーでlocalStorageを使う
        this.localStorage = new Store("addressbook-sample");
    }
    return AddressCollection;
})(Backbone.Collection);
var g_Addresses = new AddressCollection();
var AddressView = (function (_super) {
    __extends(AddressView, _super);
    function AddressView(options) {
        this.tagName = "li";
        //TODO:これが無くてなぜ動作する？？
        //this.className = "address-item";
        //イベントハンドラの設定				
        this.events = {
            "dblclick label.name": "_rename",
            "click button.delete": "_clear"
        };
        _super.call(this, options);
        this.model.bind("change", this._render, this);
        this.model.bind("destroy", this.remove, this);
        this.model.bind("invalid", this._renderMessage, this);
    }
    AddressView.prototype._render = function () {
        //jquery.d.tsをNuGetで取得して対応
        var e = $('<label class="name">').text(this.model.get('name'));
        $(this.el).html(e[0].outerHTML).append("<button class='delete'>Delete</button>");
        return this;
    };
    //d,eは空です。
    AddressView.prototype._renderMessage = function (a, errors, c, d, e) {
        var es = a.validationError;
        _.each(errors, function (e) {
            if (e.attr === "name") {
                //TODO:えらーを表示できない
                //this.$("#msg").html(e.message).show();
                //↓  this.があると何が変わるのか？
                $("#msg").html(e.message).show();
            }
        });
    };
    AddressView.prototype._rename = function () {
        var newName = window.prompt("新しい名前を入力してください。", this.model.get("name"));
        this.model.save("name", newName);
    };
    AddressView.prototype._clear = function () {
        this.model.destroy();
    };
    return AddressView;
})(Backbone.View);
//AddressView.prototype.events => {};
var AppView = (function (_super) {
    __extends(AppView, _super);
    function AppView(options) {
        this.events = {
            "keypress #new-address": "_keyPress",
            "click #delete-all": "_deleteAll"
        };
        _super.call(this, options);
        //this.model = options.model;
        this.setElement($("#app"), true);
        this.input = this.$("#new-address");
        g_Addresses.bind("add", this._add, this);
        g_Addresses.bind("reset", this._addAll, this);
        g_Addresses.fetch();
    }
    AppView.prototype._add = function (address) {
        var param = { model: address };
        var view = new AddressView(param);
        this.$("#list").append(view._render().el);
    };
    AppView.prototype._addAll = function () {
        g_Addresses.each(this._add);
        //this.model.each(this._add);
    };
    AppView.prototype._keyPress = function (e) {
        if (e.keyCode === 13) {
            //Enterキーが押されたらモデルを追加する
            g_Addresses.create({ name: this.input.val() });
            this.input.val("");
        }
    };
    AppView.prototype._deleteAll = function (e) {
        var address;
        while (address = g_Addresses.first()) {
            address.destroy();
        }
    };
    return AppView;
})(Backbone.View);
$(function () {
    new AppView({ model: g_Addresses });
    var dec = {};
    dec["a"] = "1";
    dec["b"] = "33";
    console.log("a:" + dec["a"]);
    //1
    console.log("none:" + dec["hogehoge"]);
    //undefined
    _.each(dec, function (v) {
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
//# sourceMappingURL=addressbooks.js.map