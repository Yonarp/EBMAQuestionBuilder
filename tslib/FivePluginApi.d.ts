import mui_ThemeProvider from '@mui/material/styles/ThemeProvider';
import mui_CardActions from '@mui/material/CardActions';
import mui_TextField from '@mui/material/TextField';
import mui_Dialog from '@mui/material/Dialog';
import mui_DialogActions from '@mui/material/DialogActions';
import mui_DialogContent from '@mui/material/DialogContent';
import mui_CircularProgress from '@mui/material/CircularProgress';
import mui_Tooltip from '@mui/material/Tooltip';
import mui_TableCell from '@mui/material/TableCell';
import mui_Drawer from '@mui/material/Drawer';
import mui_ListItemIcon from '@mui/material/ListItemIcon';
import mui_ListItemText from '@mui/material/ListItemText';
import mui_Collapse from '@mui/material/Collapse';
import mui_Checkbox from '@mui/material/Checkbox';
import mui_FormGroup from '@mui/material/FormGroup';
import mui_FormControlLabel from '@mui/material/FormControlLabel';
declare let ThemeProvider: typeof mui_ThemeProvider;
declare let Paper: import("@mui/material/OverridableComponent").OverridableComponent<import("@mui/material/Paper").PaperTypeMap<{}, "div">>;
declare let AppBar: import("@mui/material/OverridableComponent").OverridableComponent<import("@mui/material/AppBar").AppBarTypeMap<{}, "header">>;
declare let Avatar: import("@mui/material/OverridableComponent").OverridableComponent<import("@mui/material/Avatar").AvatarTypeMap<{}, "div">>;
declare let Box: import("@mui/types").OverridableComponent<import("@mui/system").BoxTypeMap<{}, "div", import("@mui/material").Theme>>;
declare let Card: import("@mui/material/OverridableComponent").OverridableComponent<import("@mui/material/Card").CardTypeMap<{}, "div">>;
declare let CardActions: typeof mui_CardActions;
declare let CardContent: import("@mui/material/OverridableComponent").OverridableComponent<import("@mui/material/CardContent").CardContentTypeMap<{}, "div">>;
declare let CardHeader: import("@mui/material/CardHeader").OverridableCardHeader;
declare let CardMedia: import("@mui/material/OverridableComponent").OverridableComponent<import("@mui/material/CardMedia").CardMediaTypeMap<{}, "div">>;
declare let Typography: import("@mui/material/OverridableComponent").OverridableComponent<import("@mui/material/Typography").TypographyTypeMap<{}, "span">>;
declare let IconButton: import("@mui/material").ExtendButtonBase<import("@mui/material/IconButton").IconButtonTypeMap<{}, "button">>;
declare let Grid: import("@mui/material/OverridableComponent").OverridableComponent<import("@mui/material/Grid").GridTypeMap<{}, "div">>;
declare let TextField: typeof mui_TextField;
declare let InputAdornment: import("@mui/material/OverridableComponent").OverridableComponent<import("@mui/material/InputAdornment").InputAdornmentTypeMap<{}, "div">>;
declare let InputLabel: import("@mui/material/OverridableComponent").OverridableComponent<import("@mui/material/InputLabel").InputLabelTypeMap<{}, "label">>;
declare let FormControl: import("@mui/material/OverridableComponent").OverridableComponent<import("@mui/material/FormControl").FormControlTypeMap<{}, "div">>;
declare let Dialog: typeof mui_Dialog;
declare let DialogTitle: import("@mui/material/OverridableComponent").OverridableComponent<import("@mui/material/DialogTitle").DialogTitleTypeMap<{}, "span">>;
declare let DialogActions: typeof mui_DialogActions;
declare let DialogContent: typeof mui_DialogContent;
declare let Button: import("@mui/material").ExtendButtonBase<import("@mui/material/Button").ButtonTypeMap<{}, "button">>;
declare let CircularProgress: typeof mui_CircularProgress;
declare let Tooltip: typeof mui_Tooltip;
declare let Toolbar: import("@mui/material/OverridableComponent").OverridableComponent<import("@mui/material/Toolbar").ToolbarTypeMap<{}, "div">>;
declare let Table: import("@mui/material/OverridableComponent").OverridableComponent<import("@mui/material/Table").TableTypeMap<{}, "table">>;
declare let TableBody: import("@mui/material/OverridableComponent").OverridableComponent<import("@mui/material/TableBody").TableBodyTypeMap<{}, "tbody">>;
declare let TableCell: typeof mui_TableCell;
declare let TableContainer: import("@mui/material/OverridableComponent").OverridableComponent<import("@mui/material/TableContainer").TableContainerTypeMap<{}, "div">>;
declare let TableHead: import("@mui/material/OverridableComponent").OverridableComponent<import("@mui/material/TableHead").TableHeadTypeMap<{}, "thead">>;
declare let TableRow: import("@mui/material/OverridableComponent").OverridableComponent<import("@mui/material/TableRow").TableRowTypeMap<{}, "tr">>;
declare let TableSortLabel: import("@mui/material").ExtendButtonBase<import("@mui/material/TableSortLabel").TableSortLabelTypeMap<{}, "span">>;
declare let Divider: import("@mui/material/OverridableComponent").OverridableComponent<import("@mui/material/Divider").DividerTypeMap<{}, "hr">>;
declare let Drawer: typeof mui_Drawer;
declare let Tabs: import("@mui/material/OverridableComponent").OverridableComponent<import("@mui/material/Tabs").TabsTypeMap<{}, import("@mui/material").ExtendButtonBase<import("@mui/material").ButtonBaseTypeMap<{}, "button">>>>;
declare let Tab: import("@mui/material").ExtendButtonBase<import("@mui/material/Tab").TabTypeMap<{}, "div">>;
declare let List: import("@mui/material/List").ExtendList<import("@mui/material/List").ListTypeMap<{}, "ul">>;
declare let ListItem: ((props: {
    href: string;
} & {
    button: true;
} & import("@mui/material/ListItem").ListItemBaseProps & {
    components?: {
        Root?: import("react").ElementType<any>;
    };
    componentsProps?: {
        root?: import("react").HTMLAttributes<HTMLDivElement> & import("@mui/material/ListItem").ListItemComponentsPropsOverrides;
    };
    slotProps?: {
        root?: import("react").HTMLAttributes<HTMLDivElement> & import("@mui/material/ListItem").ListItemComponentsPropsOverrides;
    };
    slots?: {
        root?: import("react").ElementType<any>;
    };
} & Omit<{
    action?: import("react").Ref<import("@mui/material").ButtonBaseActions>;
    centerRipple?: boolean;
    children?: import("react").ReactNode;
    classes?: Partial<import("@mui/material").ButtonBaseClasses>;
    disabled?: boolean;
    disableRipple?: boolean;
    disableTouchRipple?: boolean;
    focusRipple?: boolean;
    focusVisibleClassName?: string;
    LinkComponent?: import("react").ElementType<any>;
    onFocusVisible?: import("react").FocusEventHandler<any>;
    sx?: import("@mui/system").SxProps<import("@mui/material").Theme>;
    tabIndex?: number;
    TouchRippleProps?: Partial<import("@mui/material/ButtonBase/TouchRipple").TouchRippleProps>;
    touchRippleRef?: import("react").Ref<import("@mui/material/ButtonBase/TouchRipple").TouchRippleActions>;
}, "classes"> & import("@mui/material/OverridableComponent").CommonProps & Omit<Omit<import("react").DetailedHTMLProps<import("react").AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>, "ref"> & {
    ref?: import("react").Ref<HTMLAnchorElement>;
}, "button" | "style" | "children" | "className" | "classes" | "tabIndex" | "action" | "centerRipple" | "disabled" | "disableRipple" | "disableTouchRipple" | "focusRipple" | "focusVisibleClassName" | "LinkComponent" | "onFocusVisible" | "sx" | "TouchRippleProps" | "touchRippleRef" | "alignItems" | "autoFocus" | "selected" | "slotProps" | "slots" | "components" | "componentsProps" | "dense" | "ContainerComponent" | "ContainerProps" | "disableGutters" | "disablePadding" | "divider" | "secondaryAction">) => JSX.Element) & import("@mui/material/OverridableComponent").OverridableComponent<import("@mui/material").ExtendButtonBaseTypeMap<import("@mui/material/ListItem").ListItemTypeMap<{
    button: true;
}, "div">>> & import("@mui/material/OverridableComponent").OverridableComponent<import("@mui/material/ListItem").ListItemTypeMap<{
    button?: false;
}, "li">>;
declare let ListItemIcon: typeof mui_ListItemIcon;
declare let ListItemText: typeof mui_ListItemText;
declare let ListItemSecondaryAction: ((props: import("@mui/material/ListItemSecondaryAction").ListItemSecondaryActionProps) => JSX.Element) & {
    muiName: string;
};
declare let Collapse: typeof mui_Collapse;
declare let Select: (<T>(props: import("@mui/material/Select").SelectProps<T>) => JSX.Element) & {
    muiName: string;
};
declare let MenuItem: import("@mui/material").ExtendButtonBase<import("@mui/material/MenuItem").MenuItemTypeMap<{}, "li">>;
declare let Checkbox: typeof mui_Checkbox;
declare let Icon: import("@mui/material/OverridableComponent").OverridableComponent<import("@mui/material/Icon").IconTypeMap<{}, "span">> & {
    muiName: string;
};
declare let FormGroup: typeof mui_FormGroup;
declare let FormControlLabel: typeof mui_FormControlLabel;
declare let FormLabel: import("@mui/material/OverridableComponent").OverridableComponent<import("@mui/material/FormLabel").FormLabelTypeMap<{}, "label">>;
declare let CloseIcon: import("@mui/material/OverridableComponent").OverridableComponent<import("@mui/material").SvgIconTypeMap<{}, "svg">> & {
    muiName: string;
};
export declare function FiveInitialize(): void;
export { ThemeProvider, Paper, AppBar, Avatar, Box, Card, CardActions, CardContent, CardHeader, CardMedia, Typography, IconButton, Grid, TextField, InputAdornment, InputLabel, FormControl, Dialog, DialogTitle, DialogActions, DialogContent, Button, CircularProgress, Tooltip, Toolbar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, Divider, Drawer, Tabs, Tab, List, ListItem, ListItemIcon, ListItemText, Collapse, Select, MenuItem, ListItemSecondaryAction, Checkbox, Icon, FormGroup, FormControlLabel, FormLabel, CloseIcon, };
