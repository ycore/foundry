// https://codesandbox.io/p/sandbox/qwodzl6jm
import React from 'react';

export const LIFE_CYCLE = Object.freeze({
  SINGLETON: 'singleton',
  TRANSIENT: 'transient',
});

class RegisteredObject {
  constructor(tTypeToResolve, concreteType, lifeCycle, factoryFunc, parameters) {
    this.typeToResolve = tTypeToResolve;
    this.concreteType = concreteType;
    this.lifeCycle = lifeCycle;
    this.parameters = parameters;
    this.factoryFn = factoryFunc;
    this.instance = null;
  }

  createInstance(args) {
    if (this.factoryFn) {
      return (this.instance = this.factoryFn.call(this, args));
    } else if (typeof this.concreteType === 'function') {
      return (this.instance = Reflect.construct(this.concreteType, args));
    } else {
      return (this.instance = this.concreteType);
    }
  }
}

class IocContainer {
  constructor() {
    this.registeredObjects = [];
  }

  register(tTypeToResolve, tConcrete, factoryFunc, lifeCycle = LIFE_CYCLE.SINGLETON, parameters = []) {
    this.registeredObjects.push(new RegisteredObject(tTypeToResolve, tConcrete, lifeCycle, factoryFunc, parameters));
  }

  resolve(typeToResolve) {
    return this._resolveObject(typeToResolve);
  }

  _resolveObject(typeToResolve) {
    const registeredObject = this.registeredObjects.find((o) => o.typeToResolve === typeToResolve);
    if (registeredObject == null) {
      throw new Error(`The type ${typeToResolve.name} has not been registered`);
    }
    return this._getInstance(registeredObject);
  }

  _getInstance(registeredObject) {
    if (!registeredObject.instance || registeredObject.lifeCycle === LIFE_CYCLE.TRANSIENT) {
      const parameters = this._resolveConstructorParameters(registeredObject);
      registeredObject.createInstance(parameters);
    }

    return registeredObject.instance;
  }

  _resolveConstructorParameters(registeredObject) {
    return (registeredObject.parameters || []).map((parameterType) => this._resolveObject(parameterType));
  }
}

// create DI container
export const container = new IocContainer();

/**
 * helper function to inject servces to react components
 * @exmaple
 * inject(Component, {
 *  api: RestAPI // inject by typeof
 * })
 */
export function inject(WrappedComponent, parameters) {
  class IOCInject extends React.PureComponent {
    constructor(props) {
      super(props);

      const newProps = Object.assign({}, props);
      Object.keys(parameters).forEach((key) => {
        newProps[key] = container.resolve(parameters[key]);
      });
      this.newProps = newProps;
    }

    render() {
      debugger;
      return React.createElement(WrappedComponent, this.newProps);
    }
  }

  IOCInject.WrappedComponent = WrappedComponent;
  // Best practices for HOCs via https://github.com/airbnb/javascript/tree/master/react
  function getComponentName() {
    return WrappedComponent.displayName || WrappedComponent.name || 'Component';
  }

  IOCInject.displayName = `IOCInject(${getComponentName()})`;

  return IOCInject;
}

export default {
  LIFE_CYCLE,
  inject,
  container,
};
