using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TT_API.Models {
    public class MapPermission {

        [Key]
        public int MapPermissionID { get; set; }
        public int IDMap { get; set; }
        public int IDUser { get; set; }
        public string Permission {  get; set; }

        [ForeignKey("IDMap")]
        public Map Map { get; set; }

        [ForeignKey("IDUser")]
        public User User { get; set; }

    }
}
