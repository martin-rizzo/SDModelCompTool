import React, { Component, useState } from "react";
import { Grid, Menu, Button, Icon, Checkbox } from "semantic-ui-react";


class MainMenu extends Component {


  showMenu(show) {
    console.log("showMenu(",show,")");
    this.props.onShowMenu(show);
  }

  render() {

    return (
        <div className="MainMenu">
        {/*<Menu borderless inverted fluid fixed="top">*/}
        {/*-- PC MENU -------------*/}
        <Menu borderless >
          <Menu.Item>
            <Checkbox
              label={{ children: <code>visible</code> }}
              onChange={ (e, data) => this.showMenu(data.checked) }
            />
          </Menu.Item>
          <Menu.Item header>
            Stable Diffusion Photorealistic Models
          </Menu.Item>
          <Menu.Menu position="right">
            <Menu.Item as="a">Settings</Menu.Item>
            <Menu.Item as="a">Help</Menu.Item>
          </Menu.Menu>
        </Menu>
        {/*
        <Grid padded className="tablet computer only">
          <Menu>
            <Menu.Item header as="a">
              Stable Diffusion Photorealistic Models
            </Menu.Item>
            <Menu.Menu position="right">
              <Menu.Item as="a">Settings</Menu.Item>
              <Menu.Item as="a">Help</Menu.Item>
            </Menu.Menu>
          </Menu>
        </Grid>
        */}
        {/*-- Mobile MENU ----------*/}
        {/*
        <Grid padded className="mobile only">
          <Menu borderless inverted fluid fixed="top">
            <Menu.Item header as="a">
              Project Name
            </Menu.Item>
            <Menu.Menu position="right">
              <Menu.Item>
                <Button
                  basic
                  inverted
                  icon
                  toggle
                  onClick={this.handleToggleDropdownMenu}
                >
                  <Icon name="content" />
                </Button>
              </Menu.Item>
            </Menu.Menu>
            <Menu
              borderless
              fluid
              inverted
              vertical
              style={this.state.dropdownMenuStyle}
            >
              <Menu.Item as="a">Settings</Menu.Item>
              <Menu.Item as="a">Help</Menu.Item>
            </Menu>
          </Menu>
        </Grid>
        */}
      </div>
    );
  }
}

export default MainMenu;
