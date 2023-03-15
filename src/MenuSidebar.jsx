import { Divider, Menu, Sidebar, Segment } from "semantic-ui-react";

export default function MenuSideBar({
  visible,
  left,
  children
})
{
  return (
    <div className="MenuSideBar">
      <Sidebar.Pushable as={Segment}>
        <Sidebar
          as={Menu}
          visible={visible}
          direction={left ? 'left' : 'right'}
          animation='push'
          icon='labeled'
          inverted
          vertical
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
            {children}
          </Segment>
        </Sidebar.Pusher>
      </Sidebar.Pushable>
    </div>
  )
}

