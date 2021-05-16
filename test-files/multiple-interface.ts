interface IInterface {
  name: string;
}

class MyClass implements IInterface {
  public name = "MyClass";
}

interface IInterface2 {
  name: string;

  length: number;

  description: string;
}

interface IInterface3 {
  readonly name: string;

  readonly length: number;
}

interface IInterfaceWithComment {
  /**
   * Some jsDoc to describe the property
   */
  name: string;

  /** One liner of the jsDoc */
  length: number;
}
