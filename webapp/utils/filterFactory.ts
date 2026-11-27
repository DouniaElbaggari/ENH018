import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import type Token from "sap/m/Token";

export type Primitive = string | number | boolean | Date | null | undefined;

export interface SingleFilterConfig {
  path: string;
  operator?: FilterOperator;
  value: Primitive;
}

export interface MultiValueFilterConfig {
  path: string;
  operator?: FilterOperator;
  values: Primitive[];
  and?: boolean; // false = OR, true = AND
}

export interface TokenFilterConfig {
  path: string;
  operator?: FilterOperator;
  tokens: Token[];
  and?: boolean; // false = OR, true = AND
  useKey?: boolean; // true => token.getKey(), false => token.getText()
}

export interface MultiComboBoxFilterConfig {
  path: string;
  operator?: FilterOperator;
  selectedKeys: String[];
  and?: boolean; // false = OR, true = AND
  //useKey?: boolean; // true => token.getKey(), false => token.getText()
}

export default class FilterFactory {
  public static eq(path: string, value: Primitive): Filter | null {
    return this.simple(path, FilterOperator.EQ, value);
  }

  public static contains(path: string, value: Primitive): Filter | null {
    return this.simple(path, FilterOperator.Contains, value);
  }

  public static simple(
    path: string,
    operator: FilterOperator = FilterOperator.EQ,
    value: Primitive
  ): Filter | null {
    if (this.isEmpty(value)) {
      return null;
    }

    return new Filter({
      path,
      operator,
      value1: value as string | number | boolean | Date
    });
  }

  public static fromSingle(config: SingleFilterConfig): Filter | null {
    return this.simple(
      config.path,
      config.operator ?? FilterOperator.EQ,
      config.value
    );
  }

  public static fromMultiValues(config: MultiValueFilterConfig): Filter | null {
    const aFilters = config.values
      .filter((value) => !this.isEmpty(value))
      .map((value) =>
        new Filter({
          path: config.path,
          operator: config.operator ?? FilterOperator.EQ,
          value1: value as string | number | boolean | Date
        })
      );

    if (aFilters.length === 0) {
      return null;
    }

    if (aFilters.length === 1) {
      return aFilters[0];
    }

    return new Filter({
      filters: aFilters,
      and: config.and ?? false
    });
  }

  public static fromMultiCombo(config: MultiComboBoxFilterConfig): Filter | null {
    
  }

  public static fromTokens(config: TokenFilterConfig): Filter | null {
    const aValues = config.tokens
      .map((token) => {
        const sValue = config.useKey === false ? token.getText() : token.getKey() || token.getText();
        return sValue;
      })
      .filter((value) => !this.isEmpty(value));

    return this.fromMultiValues({
      path: config.path,
      operator: config.operator ?? FilterOperator.EQ,
      values: aValues,
      and: config.and ?? false
    });
  }

  public static and(filters: Array<Filter | null | undefined>): Filter | null {
    const aValid = filters.filter(Boolean) as Filter[];

    if (aValid.length === 0) {
      return null;
    }

    if (aValid.length === 1) {
      return aValid[0];
    }

    return new Filter({
      filters: aValid,
      and: true
    });
  }

  public static or(filters: Array<Filter | null | undefined>): Filter | null {
    const aValid = filters.filter(Boolean) as Filter[];

    if (aValid.length === 0) {
      return null;
    }

    if (aValid.length === 1) {
      return aValid[0];
    }

    return new Filter({
      filters: aValid,
      and: false
    });
  }

  public static toArray(filter: Filter | null | undefined): Filter[] {
    return filter ? [filter] : [];
  }

  private static isEmpty(value: Primitive): boolean {
    return (
      value === null ||
      value === undefined ||
      (typeof value === "string" && value.trim() === "")
    );
  }
}