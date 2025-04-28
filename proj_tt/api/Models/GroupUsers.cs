using System.ComponentModel.DataAnnotations;

namespace TT_API.Models {
    public class GroupUsers {

        [Key]
        public int GroupID { get; set; }
        public int IdPermission { get; set; }
        public int IdUser { get; set; }
    }
}
