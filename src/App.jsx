import React, { Component } from "react";
import TopBar  from "./TopBar"
import MenuSidebar from "./MenuSidebar";
import ModelSelector from "./ModelSelector";

// import "semantic-ui-css/semantic.min.css";

import {
  Divider,
  Grid,
  Header,
  Table
} from "semantic-ui-react";

import "./App.css";

class App extends Component {
  state = {
    dropdownMenuStyle: {
      display: "none"
    },
    showMenu: false
  };

  handleToggleDropdownMenu = () => {
    let newState = Object.assign({}, this.state);
    if (newState.dropdownMenuStyle.display === "none") {
      newState.dropdownMenuStyle = { display: "flex" };
    } else {
      newState.dropdownMenuStyle = { display: "none" };
    }

    this.setState(newState);
  };

  render() {
    return (
      <div className="App">
        <TopBar
          menuButtonLeft={true}
          menuButtonDown={false}
          onMenuButtonClick={ (state) => this.setState({ showMenu:state }) }
          />
        <MenuSidebar
          visible={this.state.showMenu}
          left={true}
          >
        <Grid padded>

          <Grid.Column
            mobile={16}
            tablet={16}
            computer={16}
            floated="right"
            id="content"
          >

            <Grid padded>

              <Grid.Row>
                <Header dividing size="huge" as="h1">
                  Car & sushi bar
                </Header>
              </Grid.Row>

              <Grid.Row textAlign="center">
                <Grid.Column mobile={8} tablet={4} computer={4}>
                  <ModelSelector />
                </Grid.Column>
                <Grid.Column mobile={8} tablet={4} computer={4}>
                  <ModelSelector />
                </Grid.Column>
              </Grid.Row>

              <Divider section hidden />

              <Grid.Row>
                <Header dividing size="huge" as="h1">
                  Model information
                </Header>
              </Grid.Row>

              <Grid.Row>
                <Table singleLine striped selectable unstackable>
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell>#</Table.HeaderCell>
                      <Table.HeaderCell>Header</Table.HeaderCell>
                      <Table.HeaderCell>Header</Table.HeaderCell>
                      <Table.HeaderCell>Header</Table.HeaderCell>
                      <Table.HeaderCell>Header</Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    <Table.Row>
                      <Table.Cell>1.001</Table.Cell>
                      <Table.Cell>Lorem</Table.Cell>
                      <Table.Cell>ipsum</Table.Cell>
                      <Table.Cell>dolor</Table.Cell>
                      <Table.Cell>sit</Table.Cell>
                    </Table.Row>
                  </Table.Body>
                </Table>
              </Grid.Row>
            </Grid>
          </Grid.Column>
        </Grid>
        </MenuSidebar>
      </div>
    );
  }
}

export default App;
