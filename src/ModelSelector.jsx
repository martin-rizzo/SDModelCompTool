import React, { Component } from "react";
import { Image, Label } from "semantic-ui-react";


class ModelSelector extends Component {

  render() {
    return (
      <div className="ModelSelector">
        <Image
          centered
          circular
          size="small"
          src="/static/images/wireframe/square-image.png"
        />
        <Label basic size="large">
          Label
        </Label>
        <p>Something else</p>
      </div>
    );
  }

}

export default ModelSelector;
