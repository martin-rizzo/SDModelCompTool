/**
 * @file      TopBar.jsx
 * @summary   Component for the top bar of the app.
 * @since     Mar 15, 2023
 * @author    Martin Rizzo | <martinrizzo@gmail.com>
 * @copyright Copyright (c) 2023 Martin Rizzo.
 *            This project is licensed under the MIT License.
 * -------------------------------------------------------------------------
 *          Stable Diffusion Photorealistic Model Comparison Tool
 * -----------------------------------------------------------------------*/
import { useState } from "react";
import { Menu, Button } from "semantic-ui-react";

/**
 * Renders the menu button.
 * @param {boolean} visible - Indicates whether the button should be visible or not.
 * @param {boolean} active - Indicates whether the button is active or not.
 * @param {function} onClick - Function to be executed when the button is clicked.
 * @returns {JSX.Element|null} - JSX element representing the button, or null if visible is false.
 */
function MenuButton({
  visible,
  active,
  onClick
}) {
  if (!visible) { return null; }
  return (
    <Menu.Item>
      <Button toggle active={active} onClick={onClick} icon='bars' />
    </Menu.Item>
  );
}


export default function TopBar({
  menuButtonLeft,
  menuButtonDown,
  onMenuButtonClick
}) {
  const [menuButtonActive, setMenuButtonActive] = useState(menuButtonDown)

  function handleMenuButtonChange(e,{active}) {
    console.log("handleMenuButtonChange", e, !active);
    setMenuButtonActive(!active)
    onMenuButtonClick(!active);
  }

  return (
    <div className="TopBar">
    {/*<Menu borderless inverted fluid fixed="top">*/}
    {/*-- PC MENU -------------*/}
    <Menu borderless >
      <MenuButton
        visible={menuButtonLeft}
        active={menuButtonActive}
        onClick={handleMenuButtonChange}
      />
      <Menu.Item header>
        Stable Diffusion Photorealistic Model Comparison Tool
      </Menu.Item>
      <Menu.Menu position="right">
        <Menu.Item as="a">Settings</Menu.Item>
        <MenuButton
          visible={!menuButtonLeft}
          active={menuButtonActive}
          onClick={handleMenuButtonChange}
        />
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

