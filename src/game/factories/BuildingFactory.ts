import { Building } from "../entities/Building";
import type { BuildingDefinition } from "../../../shared/buildings";

export class BuildingFactory {
  public create(definition: BuildingDefinition): Building {
    return new Building(
      definition.title,
      definition.gridPosition,
      definition.width,
      definition.height,
      definition.color,
    );
  }
}
