module.exports.torrent = {
  rtorrent: {
    mode: 'xmlrpc',
    host: 'localhost',
    port: 80,
    path: '/RPC2',
    user: 'user',
    pass: 'password'
  },
  host: 'localhost',
  port: 443,
  path: '/rutorrent/plugins/data/action.php',
  authorization: 'user:password',
  destination: '/home/user/Movies/',
  disk: {
    driveName: 'Name',
    folderDelete: '/Movies_to_delete',
    folderRubbish: '/Movies_rubbish',
    folderCopy: '/New_movies'
  }
};
