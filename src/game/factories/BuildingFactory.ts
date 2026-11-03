import { Building } from "../entities/Building";
import type { IsometricConverter } from "../IsometricConverter";
import type { BuildingDefinition } from "../../../shared/buildings";

export class BuildingFactory {
  private readonly converter: IsometricConverter;

  /** `converter` is the map's: buildings are drawn on its tiles. */
  constructor(converter: IsometricConverter) {
    this.converter = converter;
  }

  public create(definition: BuildingDefinition): Building {
    return new Building(
      this.converter,
      definition.title,
      definition.gridPosition,
      definition.width,
      definition.height,
      definition.color,
    );
  }
}
