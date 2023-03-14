import React, { Component } from "react";
import { Divider, Menu, Sidebar, Segment } from "semantic-ui-react";


class PromptsSidebar extends Component {
  state = {}

  render() {
    const { activeItem } = this.state;

    /*
    return (
      <div className="PromptsSidebar">
           <Menu fluid vertical tabular>
              <Menu.Item header content="Prompts"          />
              <Menu.Item active content="Car & sushi bar"  />
              <Menu.Item        content="Car & sushi bar2" />
              <Menu.Item        content="Robot & beach"    />
              <Menu.Item        content="Another image"    />
              <Divider />
              <Menu.Item header content="System"           />
              <Menu.Item        content="Settings"         />
              <Menu.Item        content="Help"             />
              <Menu.Item        content="About"            />
            </Menu>
      </div>
    );
    */
    return (
      <div className="PromptsSidebar">
        <Sidebar.Pushable as={Segment}>
          <Sidebar
            as={Menu}
            animation='push'
            icon='labeled'
            inverted
            vertical
            visible={this.props.visible}
            width='thin'
          >
            <Menu.Item header content="Prompts"          />
            <Menu.Item active content="Car & sushi bar"  />
            <Menu.Item        content="Car & sushi bar2" />
            <Menu.Item        content="Robot & beach"    />
            <Menu.Item        content="Another image"    />
            <Divider />
            <Menu.Item header content="System"           />
            <Menu.Item        content="Settings"         />
            <Menu.Item        content="Help"             />
            <Menu.Item        content="About"            />
          </Sidebar>
          <Sidebar.Pusher>
            <Segment basic>
              {this.props.children}
            </Segment>
          </Sidebar.Pusher>
        </Sidebar.Pushable>
      </div>
    )
  }

}


export default PromptsSidebar;
