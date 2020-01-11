"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (babel) {
  const { types: t } = babel;
  class ConversionContext {
    constructor(state) {
      this.pragma = state.opts.pragma || "html";
    }

    appendString(quasis, expressions, raw) {
      if (quasis.length > expressions.length) {
        quasis[quasis.length - 1].raw += raw;
      } else {
        quasis.push({ raw });
      }
    }

    convert(path) {
      const quasis = [];
      const expressions = [];
      this.convertJSXElement(quasis, expressions, path);
      if (expressions.length === 1 && quasis.length === 0) {
        return expressions[0];
      } else {
        return t.taggedTemplateExpression(t.identifier(this.pragma), t.templateLiteral(quasis.map(item => t.templateElement(item)), expressions));
      }
    }

    convertJSXElement(quasis, expressions, path) {
      const openingElement = path.get("openingElement");
      if (openingElement.get("name").isJSXMemberExpression()) {
        this.convertCustom(quasis, expressions, path);
      } else if (/^[a-z]/.test(openingElement.node.name.name)) {
        this.convertBuiltin(quasis, expressions, path);
      } else {
        this.convertCustom(quasis, expressions, path);
      }
    }

    convertBuiltin(quasis, expressions, path) {
      const openingElement = path.get("openingElement");
      const { name } = openingElement.node.name;
      this.appendString(quasis, expressions, `<${name}`);
      const attributes = openingElement.get("attributes");
      for (const attribute of attributes) {
        if (attribute.isJSXSpreadAttribute()) {
          this.appendString(quasis, expressions, " ");
          expressions.push(this.convertObjectChildren(attribute.get("argument")));
          continue;
        }
        const { name } = attribute.node.name;
        const { value } = attribute.node;
        if (value == null) {
          this.appendString(quasis, expressions, ` ${name}`);
        } else {
          this.appendString(quasis, expressions, ` ${name}=`);
          if (value.type === "StringLiteral") {
            this.appendString(quasis, expressions, JSON.stringify(value.value));
          } else {
            expressions.push(this.convertObjectChildren(attribute.get("value")));
          }
        }
      }
      if (openingElement.node.selfClosing) {
        this.appendString(quasis, expressions, "/>");
        return;
      }
      this.appendString(quasis, expressions, ">");
      this.convertChildren(quasis, expressions, path.get("children"));
      this.appendString(quasis, expressions, `</${name}>`);
    }

    convertCustom(quasis, expressions, path) {
      const openingElement = path.get("openingElement");
      const props = [];
      const attributes = openingElement.get("attributes");
      for (const attribute of attributes) {
        if (attribute.isJSXSpreadAttribute()) {
          props.push(t.spreadProperty(this.convertObjectChildren(attribute.get("argument"))));
          continue;
        }
        const { name } = attribute.node.name;
        const { value } = attribute.node;
        if (value == null) {
          props.push(t.objectProperty(t.identifier(name), t.booleanLiteral(true)));
        } else {
          props.push(t.objectProperty(t.identifier(name), this.convertObjectChildren(attribute.get("value"))));
        }
      }
      let componentIdentifier;
      if (openingElement.get("name").isJSXMemberExpression()) {
        componentIdentifier = this.convertJSXMemberExpression(openingElement.get("name"));
      } else {
        const { name: componentName } = openingElement.node.name;
        componentIdentifier = t.identifier(componentName);
      }
      if (!openingElement.node.selfClosing) {
        const children = this.convertObjectChildren(path.get("children"));
        props.push(t.objectProperty(t.identifier("children"), children));
      }
      expressions.push(t.callExpression(t.identifier(this.pragma), [componentIdentifier, t.objectExpression(props)]));
    }

    convertJSXMemberExpression(path) {
      if (path.isJSXIdentifier()) {
        return t.identifier(path.node.name);
      } else if (path.isJSXMemberExpression()) {
        return t.memberExpression(this.convertJSXMemberExpression(path.get("object")), this.convertJSXMemberExpression(path.get("property")));
      }
      return path.node;
    }

    convertObjectChildren(path) {
      if (Array.isArray(path)) {
        return t.arrayExpression(path.map(this.convertObjectChildren, this));
      } else if (path.type === "JSXElement") {
        return this.convert(path);
      } else if (path.type === "JSXText") {
        return t.stringLiteral(path.node.value);
      } else if (path.type === "JSXExpressionContainer") {
        return this.convertObjectChildren(path.get("expression"));
      } else {
        return path.node;
      }
    }

    convertChildren(quasis, expressions, path) {
      if (Array.isArray(path)) {
        for (const child of path) {
          this.convertChildren(quasis, expressions, child);
        }
      } else if (path.type === "JSXElement") {
        this.convertJSXElement(quasis, expressions, path);
      } else if (path.type === "JSXText") {
        this.appendString(quasis, expressions, path.node.value);
      } else if (path.type === "JSXExpressionContainer") {
        expressions.push(path.node.expression);
      }
    }
  }

  return {
    visitor: {
      JSXElement(path, state) {
        const context = new ConversionContext(state);
        path.replaceWith(context.convert(path));
      }
    }
  };
};